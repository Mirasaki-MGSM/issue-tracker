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
import { Issue, IssueCommentCreatedPayload, IssueCommentDeletedPayload, IssueCommentEditedPayload, IssueCommentPayload } from '../types.js';

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
  static commentLinkButton = (comment: IssueCommentPayload['comment']): ButtonBuilder => new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel("View on GitHub")
    .setURL(comment.html_url)
    .setEmoji("🔗")
    .setDisabled(false)
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
      // appliedTags: ['issue'], // [DEV] Integration with labels
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      rateLimitPerUser: 0,
      reason: `Issue created by GitHub issue sync.`,
    });
  
    return thread;
  }

  // 
  // Start Events/Listeners
  // 

  public static async onIssueCommentCreated(payload: IssueCommentCreatedPayload) {
    const [ thread ] = await Promise.all([
      DiscordHandler.getThread(payload.issue),
    ]);

    await thread.send({
      embeds: [ DiscordBuilders.commentEmbed(payload.comment) ],
      allowedMentions: defaultAllowedMentions,
      files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.issueDebugFile(payload.issue) ],
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
      files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.issueDebugFile(payload.issue) ],
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
      files: parsedEnv.NODE_ENV === 'production' ? [] : [ DiscordBuilders.issueDebugFile(payload.issue) ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          DiscordBuilders.commentLinkButton(payload.comment),
        ),
      ],
    });
  }
}