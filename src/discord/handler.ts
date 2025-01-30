import { 
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  Colors,
  EmbedBuilder,
  ForumChannel,
  GatewayIntentBits,
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

export class DiscordBuilders {
  static issueThreadName = (issue: Issue): string => `[issue-${issue.id}] ${issue.title}`

  static issueLinkButton = (issue: Issue): ButtonBuilder => new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel("View on GitHub")
    .setURL(issue.html_url)
    .setEmoji("🔗")
    .setDisabled(false)
  static issueEmbed = (issue: Issue): EmbedBuilder => new EmbedBuilder()
    .setColor(Colors.Aqua)
    .setTitle(issue.title)
    .setURL(issue.html_url)
    .setDescription(issue.body)
    .setTimestamp(new Date(issue.updated_at))
    .setFooter({
      text: `Issue updated at`,
      iconURL: issue.user.avatar_url ?? undefined,
    })
    .setAuthor({
      name: issue.user.login,
      iconURL: issue.user.avatar_url ?? undefined,
      url: issue.user.html_url ?? undefined,
    })
    .setFields([
      {
        name: "State",
        value: issue.state,
        inline: true,
      },
      {
        name: "Assignee",
        value: issue.assignee ? issue.assignee.login : "None",
        inline: true,
      },
      {
        name: "Milestone",
        value: issue.milestone ? issue.milestone.title : "None",
        inline: true,
      },
    ])
  static issueDebugFile = (issue: Issue): AttachmentBuilder => new AttachmentBuilder(
    Buffer.from(JSON.stringify(issue, null, 2), 'utf-8')
  )
    .setName(`issue-${issue.id}.json`)
    .setDescription(`Debug information for issue ${issue.id}.`)
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
    .setDescription(comment.body)
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

  private constructor() {}

  static init = async (): Promise<void> => {
    await DiscordHandler.getClient()
    await DiscordHandler.getChannel()
    await DiscordHandler.syncLabels()
  }

  static getClient = (): Promise<Client<true>> => {
    return new Promise((resolve) => {
      if (DiscordHandler.client.isReady()) {
        resolve(DiscordHandler.client)
        return;
      }
  
      DiscordHandler.client.login(parsedEnv.DISCORD_CLIENT_TOKEN)
      DiscordHandler.client.once('ready', (c) => {
        console.log(`Discord client ready and logged in as ${c.user.username}.`)
        resolve(c)
      })
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

  static getThread = async (issue: Issue): Promise<ThreadChannel> => {
    const channel = await DiscordHandler.getChannel();
    const threads = await channel.threads.fetch({}, { cache: true });
    const thread = threads.threads.find((t) => t.name === DiscordBuilders.issueThreadName(issue));
  
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
      const tag = tags.find((t) => t.name === label.name);

      if (!tag) {
        throw new Error(`Discord tag for GitHub label ${label.name} not found.`);
      }

      return tag.id;
    });
  }

  static createThreadFromIssue = async (issue: Issue): Promise<ThreadChannel> => {
    const channel = await DiscordHandler.getChannel();
    const thread = await channel.threads.create({
      name: DiscordBuilders.issueThreadName(issue),
      message: {
        embeds: [
          DiscordBuilders.issueEmbed(issue),
        ],
        allowedMentions: defaultAllowedMentions,
        files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.issueDebugFile(issue) ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            DiscordBuilders.issueLinkButton(issue),
          ),
        ]
      },
      appliedTags: await DiscordHandler.tagsForLabels(issue.labels),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      rateLimitPerUser: 0,
      reason: `Issue created by GitHub issue sync.`,
    });
  
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
      value: `\`\`\`\n${payload.changes.body.from}\n\`\`\``.slice(0, 1024),
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
        moderated: false
      }))
    ], `Labels synced from GitHub. ${missingLabels.length} labels added.`)
  }

  public static async onLabelCreated(payload: LabelCreatedPayload) {
    const channel = await DiscordHandler.getChannel();
    const label = payload.label;

    if (channel.availableTags.length === 20) {
      throw new Error(`The maximum number of labels has been reached. Please remove a label before adding a new one. (Discord currently has ${channel.availableTags.length} labels, out of a maximum of 20.)`);
    }

    await channel.setAvailableTags([
      ...channel.availableTags,
      {
        name: label.name,
        moderated: false,
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

    await channel.setAvailableTags(channel.availableTags.map((e) => e.name === payload.changes.name.from ? {
      name: label.name,
      moderated: false,
      id: e.id,
      emoji: e.emoji,
    } : e), `Label edited by ${payload.sender.login}.`)
  }
  
  // 
  // Start Issues
  // 

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
      content: `🗑️ Issue deleted by ${payload.sender.login}.`,
      allowedMentions: defaultAllowedMentions,
    });

    return thread.edit({
      archived: true,
      locked: true,
      reason: `Issue deleted by ${payload.sender.login}.`,
    })
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
      DiscordHandler.getThread(payload.issue),
    ])
    const embed = DiscordBuilders.issueEmbed(payload.issue)

    embed.setColor(Colors.Yellow)
    embed.setTitle("Issue edited")
    embed.setFields([
      {
        name: "Previous title",
        value: `${payload.changes.title.from}`.slice(0, 1024),
      },
      {
        name: "Previous body",
        value: `${payload.changes.body.from}`.slice(0, 1024),
        inline: false,
      },
    ])

    const messages = await thread.messages.fetch({ limit: 1 });
    const firstMessage = messages.first();

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

    await thread.setAppliedTags([
      ...thread.appliedTags,
      ...(await DiscordHandler.tagsForLabels([ payload.label ])),
    ])

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
    return DiscordHandler.createThreadFromIssue(payload.issue);
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

    await thread.setAppliedTags(await DiscordHandler.tagsForLabels(payload.issue.labels))

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