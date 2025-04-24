import { 
  ActionRowBuilder,
  AttachmentBuilder,
  AuditLogEvent,
  ButtonBuilder,
  ButtonStyle,
  ChannelFlags,
  ChannelType,
  Client,
  Colors,
  EmbedBuilder,
  ForumChannel,
  GatewayIntentBits,
  GuildForumThreadCreateOptions,
  MessageMentionOptions,
  ThreadAutoArchiveDuration,
  ThreadChannel
} from 'discord.js';
import { parsedEnv } from '../env.js';
import type {
  Issue,
  IssueAssignedPayload,
  IssueClosedPayload,
  IssueCommentCreatedPayload,
  IssueCommentDeletedPayload,
  IssueCommentEditedPayload,
  IssueCommentPayload,
  IssueDeletedPayload,
  IssueDemilestonedPayload,
  IssueEditedPayload,
  IssueLabeledPayload,
  IssueLockedPayload,
  IssueMilestonedPayload,
  IssueOpenedPayload,
  IssuePinnedPayload,
  IssueReopenedPayload,
  IssueTransferredPayload,
  IssueUnassignedPayload,
  IssueUnlabeledPayload,
  IssueUnlockedPayload,
  IssueUnpinnedPayload,
  LabelCreatedPayload,
  LabelDeletedPayload,
  LabelEditedPayload
} from '../types.js';
import { octokit } from '../github/init.js';

const defaultAllowedMentions: MessageMentionOptions = {
  parse: [],
  repliedUser: true,
  roles: [],
  users: [],
}

export const maxLengthText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

export class DiscordBuilders {
  static issueNumberFromThreadName = (name: string): number => parseInt(name.match(/\[issue-(\d+)\]/)?.[1] ?? 'isNaN')
  static issueThreadName = (
    issue: Issue,
    changes?: IssueEditedPayload['changes']
  ): string => maxLengthText(`[issue-${issue.number}] ${changes?.title?.from ?? issue.title}`, 100)

  static issueLinkButton = (issue: Issue): ButtonBuilder => new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel("View on GitHub")
    .setURL(issue.html_url)
    .setEmoji("🔗")
    .setDisabled(false)
  static issueEmbed = (issue: Issue): EmbedBuilder => new EmbedBuilder()
    .setColor(Colors.Aqua)
    .setTitle(maxLengthText(issue.title, 256))
    .setURL(issue.html_url)
    .setDescription(issue.body ? maxLengthText(issue.body, 2048) : null)
    .setTimestamp(new Date(issue.updated_at))
    .setImage(`https://share.mirasaki.dev/screenshot?${
      new URLSearchParams({
        page: issue.html_url,
        width: "1920",
        height: "1080",
        full: "true",
        landscape: "true",
        mobile: "false",
        cache: "true",
      }).toString()
    }`)
    .setFooter({
      text: `Issue updated at`,
      iconURL: issue.user?.avatar_url ?? undefined,
    })
    .setAuthor({
      name: issue.user?.login ?? "Unknown",
      iconURL: issue.user?.avatar_url ?? undefined,
      url: issue.user?.html_url ?? undefined,
    })
    .setFields([
      {
        name: "State",
        value: `${issue.state ?? 'Unknown'}`,
        inline: true,
      },
      {
        name: "Assignee",
        value: `${issue.assignee ? issue.assignee.login : "None"}`,
        inline: true,
      },
      {
        name: "Milestone",
        value: `${issue.milestone ? issue.milestone.title : "None"}`,
        inline: true,
      },
    ])
  static issueDebugFile = (issue: Issue): AttachmentBuilder => new AttachmentBuilder(
    Buffer.from(JSON.stringify(issue, null, 2), 'utf-8')
  )
    .setName(`issue-${issue.number}.json`)
    .setDescription(`Debug information for issue ${issue.number}.`)
    .setSpoiler(true)

  static commentLinkButton = (comment: IssueCommentPayload['comment']): ButtonBuilder => new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel("View on GitHub")
    .setURL(comment.html_url)
    .setEmoji("🔗")
    .setDisabled(false)
  static commentEmbed = (comment: IssueCommentPayload['comment']): EmbedBuilder => new EmbedBuilder()
    .setColor(Colors.Aqua)
    .setTitle("Comment created")
    .setDescription(maxLengthText(comment.body, 2048))
    .setTimestamp(new Date(comment.updated_at))
    .setFooter({
      text: `Comment updated at`,
      iconURL: comment.user.avatar_url ?? undefined,
    })
    .setAuthor({
      name: comment.user.login,
      iconURL: comment.user.avatar_url ?? undefined,
      url: comment.user.html_url ?? undefined,
    })
  static commentDebugFile = (comment: IssueCommentPayload['comment']): AttachmentBuilder => new AttachmentBuilder(
    Buffer.from(JSON.stringify(comment, null, 2), 'utf-8')
  )
    .setName(`comment-${comment.id}.json`)
    .setDescription(`Debug information for comment ${comment.id}.`)
    .setSpoiler(true)
}

export class DiscordHandler {
  private static _instance: DiscordHandler;
  public static get instance(): DiscordHandler {
    if (!this._instance) {
      this._instance = new DiscordHandler();
    }

    return this._instance;
  }
  private static client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  })

  /**
   * A map of GitHub issue IDs to Discord thread IDs, for user-created posts.
   * If an id is in here when an issue is created (github event), the user thread
   * should be deleted, and the user directed to the new thread
   */
  private static consumeUserCreatedPosts = new Map<number, string>()

  private constructor() {}

  static init = async (): Promise<void> => {
    await DiscordHandler.getClient()
    await DiscordHandler.getChannel()
    await DiscordHandler.syncLabels()
    await DiscordHandler.syncIssues()
  }

  static getClient = (): Promise<Client<true>> => {
    return new Promise((resolve) => {
      if (DiscordHandler.client.isReady()) {
        resolve(DiscordHandler.client)
        return;
      }
  
      DiscordHandler.registerDiscordSyncListeners()

      DiscordHandler.client.login(parsedEnv.DISCORD_CLIENT_TOKEN)
      DiscordHandler.client.once('ready', (c) => {
        console.log(`Discord client ready and logged in as ${c.user.username}.`)
        resolve(c)
      })
    });
  }

  private static registerDiscordSyncListeners = () => {
    DiscordHandler.client.on('channelDelete', (channel) => {
      if (channel.id === parsedEnv.DISCORD_CHANNEL_ID) {
        console.error(`Forum channel with ID ${parsedEnv.DISCORD_CHANNEL_ID} was deleted. Exiting.`)
        process.exit(1)
      }
    })

    // Post comments on GitHub if messages are sent in Discord threads. (onIssueCommentCreated)
    DiscordHandler.client.on('messageCreate', async (message) => {
      if (message.channel.isDMBased() || message.author.bot || !message.channel || !message.channel.parent) {
        return;
      }

      if (message.channel.parent.id !== parsedEnv.DISCORD_CHANNEL_ID) {
        return;
      }

      const issueNumber = DiscordBuilders.issueNumberFromThreadName(message.channel.name);

      if (isNaN(issueNumber)) {
        console.error(`Failed to parse issue ID from thread name ${message.channel.name}.`)
        return;
      }

      const issue = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        issue_number: issueNumber
      }).catch((e) => {
        console.error(`Failed to fetch issue ${issueNumber} from GitHub API: ${e}`)
        return { status: 404 }
      })

      if (issue.status === 404) {
        return;
      }

      await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        issue_number: issueNumber,
        body: `> **${message.author.username}**: ${message.content}`,
      })
    });

    // Remove GitHub comments when Discord messages are deleted. (onIssueCommentDeleted)
    DiscordHandler.client.on('messageDelete', async (message) => {
      if (message.channel.isDMBased() || message.author?.bot || !message.channel || !message.channel.parent) {
        return;
      }

      if (message.channel.parent.id !== parsedEnv.DISCORD_CHANNEL_ID) {
        return;
      }

      const issueNumber = DiscordBuilders.issueNumberFromThreadName(message.channel.name);

      if (isNaN(issueNumber)) {
        console.error(`Failed to parse issue ID from thread name ${message.channel.name}.`)
        return;
      }

      const comments = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        issue_number: issueNumber
      }).catch((e) => {
        console.error(`Failed to fetch comments for issue ${issueNumber} from GitHub API: ${e}`)
        return { status: 404 }
      })

      if (comments.status === 404) {
        return;
      }

      // @ts-expect-error Untyped interface
      const comment = comments.data.find((c) => c.body.startsWith(`> **${message.author?.username ?? 'Unknown'}**: ${message.content}`))

      if (!comment) {
        console.error(`Failed to find comment for message ${message.id}.`)
        return;
      }

      await octokit.request('DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        comment_id: comment.id,
      })
    });

    // Edit GitHub comments when Discord messages are edited. (onIssueCommentEdited)
    DiscordHandler.client.on('messageUpdate', async (oldMessage, newMessage) => {
      if (oldMessage.channel.isDMBased() || oldMessage.author?.bot || !oldMessage.channel || !oldMessage.channel.parent) {
        return;
      }

      if (oldMessage.channel.parent.id !== parsedEnv.DISCORD_CHANNEL_ID) {
        return;
      }

      const issueNumber = DiscordBuilders.issueNumberFromThreadName(oldMessage.channel.name);

      if (isNaN(issueNumber)) {
        console.error(`Failed to parse issue ID from thread name ${oldMessage.channel.name}.`)
        return;
      }

      const isPrimaryThreadMessage = await oldMessage.channel.messages.fetch().then((messages) => messages.last()?.id === oldMessage.id)

      if (isPrimaryThreadMessage) {
        // Update the issue body if the primary thread message is edited. (onIssueEdited)
        const issue = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          owner: parsedEnv.GITHUB_REPO_OWNER,
          repo: parsedEnv.GITHUB_REPO_NAME,
          issue_number: issueNumber
        }).catch((e) => {
          console.error(`Failed to fetch issue ${issueNumber} from GitHub API: ${e}`)
          return { status: 404 }
        })

        if (issue.status === 404) {
          return;
        }

        await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
          owner: parsedEnv.GITHUB_REPO_OWNER,
          repo: parsedEnv.GITHUB_REPO_NAME,
          issue_number: issueNumber,
          body: `${newMessage.content}\n\nCreated by ${newMessage.author.username} on [Discord](${newMessage.url})`,
        })

        return;
      }

      const comments = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        issue_number: issueNumber
      }).catch((e) => {
        console.error(`Failed to fetch comments for issue ${issueNumber} from GitHub API: ${e}`)
        return { status: 404 }
      })

      if (comments.status === 404) {
        return;
      }

      // @ts-expect-error Untyped interface
      const comment = comments.data.find((c) => c.body.startsWith(`> **${oldMessage.author?.username ?? 'Unknown'}**: ${oldMessage.content}`))

      if (!comment) {
        console.error(`Failed to find comment for message ${oldMessage.id}.`)
        return;
      }

      await octokit.request('PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        comment_id: comment.id,
        body: `> **${newMessage.author.username}**: ${newMessage.content}`,
      })
    });
    
    // Note: We do NOT support modifying labels/tags in Discord,
    // as Discord can have additional tags that are not present in GitHub.

    // Note: Assign and unassign can not be done through Discord.

    // Close GitHub issues when Discord threads are archived. (onIssueClosed)
    DiscordHandler.client.on('threadUpdate', async (oldThread, newThread) => {
      if (!oldThread.parent || oldThread.parent.id !== parsedEnv.DISCORD_CHANNEL_ID) {
        return;
      }

      if (!oldThread.name.startsWith('[issue-')) {
        return;
      }

      const client = await DiscordHandler.getClient();
      const auditEntry = await oldThread.guild.fetchAuditLogs({
        type: AuditLogEvent.ThreadUpdate,
        limit: 1,
        user: client.user,
      })
      const auditLogEntry = auditEntry.entries.first()

      if (auditLogEntry && auditLogEntry.target.id === oldThread.id) {
        console.log(`Thread ${newThread.name} was updated by our bot user - ignoring.`)
        return;
      }

      // Note: Pinning is not supported, as Discord forum channels can only have 1 pinned thread.
      // if (oldThread.lastPinTimestamp !== newThread.lastPinTimestamp) {
      //   const threads = await oldThread.parent.threads.fetch({}, { cache: true });
      //   const pinned = threads.threads.find(thread => thread.flags.has(ChannelFlags.Pinned))

      //   if (pinned) {
      //     const issueNumber = DiscordBuilders.issueNumberFromThreadName(thread.name);

      //     if (isNaN(issueNumber)) {
      //       console.error(`Failed to parse issue ID from thread name ${pinned.name}.`)
      //       return;
      //     }

      //     const issue = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
      //       owner: parsedEnv.GITHUB_REPO_OWNER,
      //       repo: parsedEnv.GITHUB_REPO_NAME,
      //       issue_number: issueNumber
      //     }).catch((e) => {
      //       console.error(`Failed to fetch issue ${issueNumber} from GitHub API: ${e}`)
      //       return { status: 404 }
      //     })

      //     if (issue.status === 404) {
      //       return;
      //     }

      //     await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      //       owner: parsedEnv.GITHUB_REPO_OWNER,
      //       repo: parsedEnv.GITHUB_REPO_NAME,
      //       issue_number: issueNumber
      //       pinned: true,
      //     })
      //   }
      // }

      if (
        (!oldThread.archived && newThread.archived)
        || (!oldThread.locked && newThread.locked)
      ) {
        const issueNumber = DiscordBuilders.issueNumberFromThreadName(oldThread.name);
        if (isNaN(issueNumber)) {
          console.error(`Failed to parse issue ID from thread name ${oldThread.name}.`)
          return;
        }

        const issue = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          owner: parsedEnv.GITHUB_REPO_OWNER,
          repo: parsedEnv.GITHUB_REPO_NAME,
          issue_number: issueNumber
        }).catch((e) => {
          console.error(`Failed to fetch issue ${issueNumber} from GitHub API: ${e}`)
          return { status: 404 }
        })

        if (issue.status === 404) {
          return;
        }

        await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
          owner: parsedEnv.GITHUB_REPO_OWNER,
          repo: parsedEnv.GITHUB_REPO_NAME,
          issue_number: issueNumber,
          state: 'closed',
        })
      }

      // When a tag is added on Discord, add the label on GitHub.
      if (oldThread.appliedTags.length !== newThread.appliedTags.length) {
        const issueNumber = DiscordBuilders.issueNumberFromThreadName(oldThread.name);
        if (isNaN(issueNumber)) {
          console.error(`Failed to parse issue ID from thread name ${oldThread.name}.`)
          return;
        }

        const issue = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
          owner: parsedEnv.GITHUB_REPO_OWNER,
          repo: parsedEnv.GITHUB_REPO_NAME,
          issue_number: issueNumber
        }).catch((e) => {
          console.error(`Failed to fetch issue ${issueNumber} from GitHub API: ${e}`)
          return { status: 404 }
        });

        if (issue.status === 404) {
          return;
        }

        const channel = await DiscordHandler.getChannel();

        await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
          owner: parsedEnv.GITHUB_REPO_OWNER,
          repo: parsedEnv.GITHUB_REPO_NAME,
          issue_number: issueNumber,
          labels: newThread.appliedTags.map((tag) => channel.availableTags.find((t) => t.id === tag)?.name)
            .filter((label) => typeof label === 'string'),
        })
      }
    });

    // Delete GitHub issues when Discord threads are deleted. (onIssueDeleted)
    DiscordHandler.client.on('threadDelete', async (thread) => {
      if (!thread.parent || thread.parent.id !== parsedEnv.DISCORD_CHANNEL_ID) {
        return;
      }

      const client = await DiscordHandler.getClient();
      const auditEntry = await thread.guild.fetchAuditLogs({
        type: AuditLogEvent.ThreadDelete,
        limit: 1,
        user: client.user,
      })
      const auditLogEntry = auditEntry.entries.first()

      if (auditLogEntry && auditLogEntry.target.id === thread.id) {
        console.log(`Thread ${thread.name} was deleted by our bot user - ignoring.`)
        return;
      }

      const issueNumber = DiscordBuilders.issueNumberFromThreadName(thread.name);
      if (isNaN(issueNumber)) {
        console.error(`Failed to parse issue ID from thread name ${thread.name}.`)
        return;
      }

      const issue = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        issue_number: issueNumber
      }).catch((e) => {
        console.error(`Failed to fetch issue ${issueNumber} from GitHub API: ${e}`)
        return { status: 404 }
      })

      if (issue.status === 404) {
        return;
      }

      await octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        issue_number: issueNumber
      })
    })

    // If a thread is created in the forum channel, create a new issue on GitHub. (onIssueOpened)
    DiscordHandler.client.on('threadCreate', async (thread) => {
      if (!thread.parent || thread.parent.id !== parsedEnv.DISCORD_CHANNEL_ID) {
        return;
      }

      const owner = await thread.fetchOwner();

      if (owner?.user?.bot) {
        return;
      }

      const channel = await DiscordHandler.getChannel();

      const issue = await octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
        title: thread.name,
        body: `${thread.messages.cache.first()?.content ?? ''}\n\nCreated by ${(await thread.fetchOwner())?.user?.username ?? 'Unknown'} on [Discord](${thread.url})`,
        labels: thread.appliedTags.map((tag) => channel.availableTags.find((t) => t.id === tag)?.name)
          .filter((label) => typeof label === 'string'),
      })

      this.consumeUserCreatedPosts.set(issue.data.number, thread.id)

      await thread.setName(DiscordBuilders.issueThreadName(issue.data))
    });
  }
  
  static getChannel = async (): Promise<ForumChannel> => {
    const client = await DiscordHandler.getClient();
    const guild = client.guilds.cache.get(parsedEnv.DISCORD_GUILD_ID);
  
    if (!guild) {
      throw new Error(`Discord guild with ID ${parsedEnv.DISCORD_GUILD_ID} not found.`);
    }
  
    const channel = guild.channels.cache.get(parsedEnv.DISCORD_CHANNEL_ID);
  
    if (!channel) {
      throw new Error(`Discord channel with ID ${parsedEnv.DISCORD_CHANNEL_ID} not found.`);
    }
  
    if (!channel.isThreadOnly()) {
      throw new Error(`Discord channel with ID ${parsedEnv.DISCORD_CHANNEL_ID} is not a forum channel.`);
    }
  
    if (channel.type === ChannelType.GuildMedia) {
      throw new Error(`Discord channel with ID ${parsedEnv.DISCORD_CHANNEL_ID} is a media channel.`);
    }
  
    return channel;
  }

  static getThread = async (
    issue: Issue,
    changes?: IssueEditedPayload['changes']
  ): Promise<ThreadChannel> => {
    const channel = await DiscordHandler.getChannel();
    const threads = await channel.threads.fetch({}, { cache: true });
    const thread = threads.threads.find((t) => t.name === DiscordBuilders.issueThreadName(issue, changes));
  
    if (!thread) {
      return DiscordHandler.createThreadFromIssue(issue);
    }
  
    return thread;
  }

  /**
   * Returns an array of Discord tag ids for the given GitHub labels.
   */
  static tagsForLabels = async (labels: Issue['labels']) => {
    const channel = await DiscordHandler.getChannel();
    const tags = channel.availableTags;

    return labels.map((label) => {
      const tag = tags.find((t) => t.name === (typeof label === 'string' ? label : label.name));

      if (!tag) {
        throw new Error(`Discord tag for GitHub label ${
          typeof label === 'string' ? label : label.name
        } not found.`);
      }

      return tag.id;
    });
  }

  static createThreadFromIssue = async (issue: Issue): Promise<ThreadChannel> => {
    const channel = await DiscordHandler.getChannel();
    const resolvedTags = await DiscordHandler.tagsForLabels(issue.labels);

    if (resolvedTags.length > 5) {
      console.warn(`Issue has more than 5 tags applied, which is the maximum allowed by Discord. Only the first 5 tags will be applied.`)
    }

    const options: GuildForumThreadCreateOptions = {
      name: DiscordBuilders.issueThreadName(issue),
      message: {
        embeds: [ DiscordBuilders.issueEmbed(issue) ],
        allowedMentions: defaultAllowedMentions,
        files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.issueDebugFile(issue) ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            DiscordBuilders.issueLinkButton(issue),
          ),
        ],
      },
      appliedTags: resolvedTags.slice(0, 5),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      rateLimitPerUser: 0,
      reason: `Issue created by GitHub issue sync.`,
    }

    const thread = await channel.threads.create(options);
  
    return thread;
  }

  // 
  // Start Events/Listeners
  // 

  // 
  // Start Issue Comments
  // 

  public static async onIssueCommentCreated(payload: IssueCommentCreatedPayload) {
    const [ thread ] = await Promise.all([
      DiscordHandler.getThread(payload.issue),
    ]);

    await thread.send({
      embeds: [ DiscordBuilders.commentEmbed(payload.comment) ],
      allowedMentions: defaultAllowedMentions,
      files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.commentDebugFile(payload.comment) ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          DiscordBuilders.commentLinkButton(payload.comment),
        ),
      ],
    });
  }

  public static async onIssueCommentDeleted(payload: IssueCommentDeletedPayload) {
    const [ thread ] = await Promise.all([
      DiscordHandler.getThread(payload.issue),
    ]);

    const embed = DiscordBuilders.commentEmbed(payload.comment)

    embed.setColor(Colors.Red)
    embed.setTitle("Comment deleted")

    await thread.send({
      embeds: [ embed ],
      allowedMentions: defaultAllowedMentions,
      files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.commentDebugFile(payload.comment) ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          DiscordBuilders.commentLinkButton(payload.comment).setDisabled(true),
        ),
      ],
    });
  }

  public static async onIssueCommentEdited(payload: IssueCommentEditedPayload) {
    const [ thread ] = await Promise.all([
      DiscordHandler.getThread(payload.issue),
    ]);

    const embed = DiscordBuilders.commentEmbed(payload.comment)

    embed.setColor(Colors.Yellow)
    embed.setTitle("Comment edited")
    embed.addFields({
      name: "Previous content",
      value: `\`\`\`\n${maxLengthText(payload.changes.body?.from ?? '', 1000)}\n\`\`\``,
    })

    await thread.send({
      embeds: [ embed ],
      allowedMentions: defaultAllowedMentions,
      files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.commentDebugFile(payload.comment) ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          DiscordBuilders.commentLinkButton(payload.comment),
        ),
      ],
    });
  }

  // 
  // Start Labels
  // 

  public static async syncLabels() {
    const [ channel, labels ] = await Promise.all([
      DiscordHandler.getChannel(),
      octokit.request('GET /repos/{owner}/{repo}/labels', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
      })
    ]);

    const channelLabels = channel.availableTags;
    const missingLabels = labels.data.filter((label) => !channelLabels.find((e) => e.name === label.name));
    const finalLength = channelLabels.length + missingLabels.length;

    if (missingLabels.length === 0) {
      return;
    }

    if (finalLength > 20) {
      throw new Error(`More than 20 labels encountered, which is the maximum allowed by Discord. Please reduce the number of labels. (Discord currently has ${channelLabels.length} labels, GitHub has ${labels.data.length} labels.)`);
    }

    await channel.setAvailableTags([
      ...channelLabels,
      ...missingLabels.map((label) => ({
        name: label.name,
        moderated: true,
      }))
    ], `Labels synced from GitHub. ${missingLabels.length} labels added.`)
  }

  public static async onLabelCreated(payload: LabelCreatedPayload) {
    const channel = await DiscordHandler.getChannel();
    const label = payload.label;

    if (!label.name) {
      throw new Error(`Label name is required.`);
    }

    if (channel.availableTags.length === 20) {
      throw new Error(`The maximum number of labels has been reached. Please remove a label before adding a new one. (Discord currently has ${channel.availableTags.length} labels, out of a maximum of 20.)`);
    }

    await channel.setAvailableTags([
      ...channel.availableTags,
      {
        name: label.name,
        moderated: true,
      }
    ], `Label created by ${payload.sender.login}.`)
  }

  public static async onLabelDeleted(payload: LabelDeletedPayload) {
    const channel = await DiscordHandler.getChannel();
    const label = payload.label;

    await channel.setAvailableTags(channel.availableTags.filter((e) => e.name !== label.name), `Label deleted by ${payload.sender.login}.`)
  }

  public static async onLabelEdited(payload: LabelEditedPayload) {
    const channel = await DiscordHandler.getChannel();
    const label = payload.label;
    const labelName = label.name;

    if (!labelName) {
      throw new Error(`Label name is required.`);
    }

    await channel.setAvailableTags(channel.availableTags.map((e) => e.name === payload.changes.name?.from ? {
      name: labelName,
      moderated: true,
      id: e.id,
      emoji: e.emoji,
    } : e), `Label edited by ${payload.sender.login}.`)
  }
  
  // 
  // Start Issues
  // 

  public static async syncIssues() {
    const [ channel, issues ] = await Promise.all([
      DiscordHandler.getChannel(),
      octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner: parsedEnv.GITHUB_REPO_OWNER,
        repo: parsedEnv.GITHUB_REPO_NAME,
      })
    ]);

    const threads = await channel.threads.fetch({}, { cache: true });
    const threadNames = threads.threads.map((t) => t.name);
    const missingIssues = issues.data.filter((issue) => !threadNames.includes(DiscordBuilders.issueThreadName(issue)));

    await Promise.all(missingIssues.map((issue) => DiscordHandler.createThreadFromIssue(issue)))
  }

  public static async onIssueAssigned(payload: IssueAssignedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    return thread.send({
      content: `🫵 Issue assigned to ${payload.issue.assignee?.login ?? "no one"}.`,
      allowedMentions: defaultAllowedMentions,
    });
  }

  public static async onIssueClosed(payload: IssueClosedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.send({
      content: `❌ Issue closed by ${payload.sender.login}.`,
      allowedMentions: defaultAllowedMentions,
    });

    return thread.edit({
      archived: true,
      reason: `Issue closed by ${payload.sender.login}.`,
    })
  }

  public static async onIssueDeleted(payload: IssueDeletedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.send({
      content: `🗑️ Issue deleted by ${payload.sender.login}, deleting thread...`,
      allowedMentions: defaultAllowedMentions,
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    return thread.delete(`Issue deleted by ${payload.sender.login}.`)
  }

  public static async onIssueDemilestoned(payload: IssueDemilestonedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    if (!payload.issue.milestone) {
      return thread.send({
        content: `📉 Issue removed from milestone.`,
        allowedMentions: defaultAllowedMentions,
      });
    }

    return thread.send({
      content: `📉 Issue removed from milestone ${payload.issue.milestone.title}.`,
      allowedMentions: defaultAllowedMentions,
    });
  }

  public static async onIssueEdited(payload: IssueEditedPayload) {
    const [ client, thread ] = await Promise.all([
      DiscordHandler.getClient(),
      DiscordHandler.getThread(payload.issue, payload.changes),
    ])
    const embed = DiscordBuilders.issueEmbed(payload.issue)

    embed.setColor(Colors.Yellow)
    embed.setTitle("Issue edited")

    const fields = [];

    if (payload.changes.title?.from !== payload.issue.title) {
      fields.push({
        name: "Previous title",
        value: maxLengthText(payload.changes.title?.from ?? 'Unknown', 255),
      })
      await thread.setName(DiscordBuilders.issueThreadName(payload.issue))
    }

    // Note: Including this would could us over the 6000 character limit for embeds.
    // if (payload.changes.body.from !== payload.issue.body) {
    //   fields.push({
    //     name: "Previous content",
    //     value: maxLengthText(payload.changes.body.from, 1024),
    //   })
    // }

    embed.setFields(fields)

    const messages = await thread.messages.fetch();
    const firstMessage = messages.last();

    if (firstMessage && firstMessage.author.id === client.user.id) {
      return firstMessage.edit({
        embeds: [ DiscordBuilders.issueEmbed(payload.issue) ],
        allowedMentions: defaultAllowedMentions,
        files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.issueDebugFile(payload.issue) ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            DiscordBuilders.issueLinkButton(payload.issue),
          ),
        ],
      });
    }

    return thread.send({
      embeds: [ embed ],
      allowedMentions: defaultAllowedMentions,
      files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.issueDebugFile(payload.issue) ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          DiscordBuilders.issueLinkButton(payload.issue),
        ),
      ],
    });
  }

  public static async onIssueLabeled(payload: IssueLabeledPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    if (!payload.label.name) {
      throw new Error(`Label name is required, please updated the GitHub label ${payload.label.id}.`);
    }

    if (thread.appliedTags.includes(payload.label.name)) {
      return;
    }

    const resolvedTags = [
      ...new Set([
        ...thread.appliedTags,
        ...(await DiscordHandler.tagsForLabels([ payload.label ])),
      ])
    ]

    if (resolvedTags.length > 5) {
      console.warn(`Issue has more than 5 tags applied, which is the maximum allowed by Discord. Only the first 5 tags will be applied.`)
    }

    await thread.setAppliedTags(resolvedTags.slice(0, 5))

    return thread.send({
      content: `🏷️ Issue labeled with ${payload.label.name}.`,
      allowedMentions: defaultAllowedMentions,
    });
  }

  public static async onIssueLocked(payload: IssueLockedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.send({
      content: `🔒 Issue locked by ${payload.sender.login}.`,
      allowedMentions: defaultAllowedMentions,
    });

    return thread.edit({
      locked: true,
      reason: `Issue locked by ${payload.sender.login}.`,
    })
  }

  public static async onIssueMilestoned(payload: IssueMilestonedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    if (!payload.issue.milestone) {
      return thread.send({
        content: `📈 Issue added to milestone.`,
        allowedMentions: defaultAllowedMentions,
      });
    }

    return thread.send({
      content: `📈 Issue added to milestone ${payload.issue.milestone.title}.`,
      allowedMentions: defaultAllowedMentions,
    });
  }

  public static async onIssueOpened(payload: IssueOpenedPayload) {
    const newThread = await DiscordHandler.createThreadFromIssue(payload.issue);

    const consumeEntry = DiscordHandler.consumeUserCreatedPosts.get(payload.issue.number);
    if (consumeEntry) {
      DiscordHandler.consumeUserCreatedPosts.delete(payload.issue.number);

      const channel = await DiscordHandler.getChannel();
      const oldThread = await channel.threads.fetch(consumeEntry);

      if (oldThread) {
        await oldThread.send({
          content: [
            `🆕 Issue created, please navigate to the new thread: [${newThread.name}](${newThread.url}).`,
            `\nThis thread will now be locked, and will be deleted in 5 minutes.`,
          ].join('\n'),
          allowedMentions: defaultAllowedMentions,
        })
        await oldThread.edit({
          archived: true,
          locked: true,
          reason: `Issue ${payload.issue.number} created, redirecting to new thread ${newThread.id}.`,
          name: oldThread.name.replace('issue-', 'moved-'),
        })
        await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 5));
        await oldThread.delete(`Issue ${payload.issue.number} created, old thread expired.`);
      }

    }

    return newThread;
  }

  public static async onIssuePinned(payload: IssuePinnedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.pin(`Issue pinned by ${payload.sender.login}.`,).catch((e) => {
      console.error(`Failed to pin thread:`);
      console.error(e);
    });

    return thread.send({
      content: `📌 Issue pinned by ${payload.sender.login}.`,
      allowedMentions: defaultAllowedMentions,
    });
  }

  public static async onIssueReopened(payload: IssueReopenedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.send({
      content: `🔓 Issue reopened by ${payload.sender.login}.`,
      allowedMentions: defaultAllowedMentions,
    });

    return thread.edit({
      archived: false,
      reason: `Issue reopened by ${payload.sender.login}.`,
    })
  }

  public static async onIssueTransferred(payload: IssueTransferredPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.send({
      content: `🔁 Issue transferred to ${payload.changes.new_repository.full_name}.`,
      allowedMentions: defaultAllowedMentions,
    });

    return thread.edit({
      archived: true,
      locked: true,
      reason: `Issue transferred to ${payload.changes.new_repository.full_name}.`,
    })
  }

  public static async onIssueUnassigned(payload: IssueUnassignedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    return thread.send({
      content: `🫵 The issue has been unassigned.`,
      allowedMentions: defaultAllowedMentions,
    });
  }

  public static async onIssueUnlabeled(payload: IssueUnlabeledPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);
    const resolvedTags = await DiscordHandler.tagsForLabels(payload.issue.labels);

    if (resolvedTags.length > 5) {
      console.warn(`Issue has more than 5 tags applied, which is the maximum allowed by Discord. Only the first 5 tags will be applied.`)
    }

    await thread.setAppliedTags(resolvedTags.slice(0, 5))

    return thread.send({
      content: `🏷️ Label "${payload.label.name}" has been removed`,
      allowedMentions: defaultAllowedMentions,
    });
  }

  public static async onIssueUnlocked(payload: IssueUnlockedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.send({
      content: `🔓 Issue unlocked by ${payload.sender.login}.`,
      allowedMentions: defaultAllowedMentions,
    });

    return thread.edit({
      locked: false,
      reason: `Issue unlocked by ${payload.sender.login}.`,
    })
  }

  public static async onIssueUnpinned(payload: IssueUnpinnedPayload) {
    const thread = await DiscordHandler.getThread(payload.issue);

    await thread.unpin(`Issue unpinned by ${payload.sender.login}.`).catch((e) => {
      console.error(`Failed to unpin thread:`);
      console.error(e);
    });

    return thread.send({
      content: `📍 Issue unpinned by ${payload.sender.login}.`,
      allowedMentions: defaultAllowedMentions,
    });
  }
}