<<<<<<< HEAD


// Mentions: `<action-text-attachment>` elements whose `sgid` names a user. Ember's sgid is the user's
// id. Campfire's are signed global ids, but any member can list every user's, so a signature protects
// nothing; and Lexxy, the composer, drops an sgid that starts like a URL, as `gid://` does, since
// DOMPurify vets every attribute's value as one.

import { attachmentNodes, loadContent, MAX_CONTENT_ATTACHMENT_DEPTH, sanitizeContentAttribute } from "./content";
import { detach, getAttr, setAttr, textContent, type Element } from "./tree";
import { GROUP_MENTION_CONTENT_TYPE, OPENGRAPH_EMBED_CONTENT_TYPE, opengraphEmbedFromNode, type MentionUser, type ResolveMention } from "./attachments";
=======
// Mentions: `<action-text-attachment>` elements whose `sgid` names a user, or makes one of Slack's
// special mentions, by its name. Ember's sgid is the user's id. Campfire's are signed global ids, but
// any member can list every user's, so a signature protects nothing; and Lexxy, the composer, drops an
// sgid that starts like a URL, as `gid://` does, since DOMPurify vets every attribute's value as one.
// A room mention's sgid is a room's id, which can look like a user's, so what reads mentions skips
// room mentions (room-mentions.ts).

import { attachmentNodes, loadContent, MAX_CONTENT_ATTACHMENT_DEPTH, sanitizeContentAttribute } from "./content";
import { createText, detach, getAttr, replaceEach, setAttr, textContent, type Element, type Text } from "./tree";
import {
  isRoomMention,
  noRooms,
  OPENGRAPH_EMBED_CONTENT_TYPE,
  opengraphEmbedFromNode,
  specialMentionOf,
  type MentionUser,
  type ResolveMention,
  type ResolveRoom,
  type SpecialMention,
} from "./attachments";
>>>>>>> ember/v0.5.0
import { BODY, ParseLimitError, type HtmlParser } from "./markup";
import { isPlainParagraph } from "./plain-paragraph";
import { previewContent } from "./previews";
import { roomMentionContent } from "./room-mentions";
import { htmlEscape } from "./ruby";
import { toHtml } from "./serialize";

/** An Ember id: 16 lowercase base-36 characters (the Worker's `sortableId`), or @ember's, which is its own (`ASSISTANT_ID`). */
const USER_ID = /^(?:[0-9a-z]{16}|ember)$/;

/** The sgid that names a user in a mention. */
export function mentionSgid(userId: string): string {
  return userId;
}

/** The id of the user an sgid names, if it names one. */
export function userIdFromSgid(sgid: string): string | undefined {
  return USER_ID.test(sgid) ? sgid : undefined;
}

/**
 * The prefix that marks an sgid as naming a user group, which none of a person's ids can: theirs are
 * exactly 16 characters, where this adds a word and a hyphen to the group's.
 */
const GROUP_SGID_PREFIX = "group-";
const GROUP_ID = /^[0-9a-z]{16}$/;

/** The sgid that names a user group in a mention. */
export function mentionGroupSgid(groupId: string): string {
  return `${GROUP_SGID_PREFIX}${groupId}`;
}

/** The id of the user group an sgid names, if it names one. */
export function groupIdFromSgid(sgid: string): string | undefined {
  return sgid.startsWith(GROUP_SGID_PREFIX) && GROUP_ID.test(sgid.slice(GROUP_SGID_PREFIX.length)) ? sgid.slice(GROUP_SGID_PREFIX.length) : undefined;
}

/** Someone as a mention shows them, by their avatar too. */
export interface MentionCard extends MentionUser {
  /** Their avatar's address. */
  avatarUrl: string;
}

/**
 * Campfire's users/_mention.html.erb: a mention as the editor shows it, the content of its attachment.
 * Unlike Campfire's, its avatar doesn't link to the person's page, which would leave what's being
 * written: a click on it picks the mention, to move or delete it, as a click on the name does.
 */
export function mentionContent({ id, name, avatarUrl }: MentionCard): string {
  return `<span class="mention" sgid="${htmlEscape(mentionSgid(id))}">${avatarTag(avatarUrl)} ${htmlEscape(name)}</span>`;
}

/**
 * A special mention as the editor shows it, the content of its attachment: its name, after an @, as
 * Slack writes it.
 */
export function specialMentionContent(mention: SpecialMention): string {
  return `<span class="mention mention--special" sgid="${mention}">@${mention}</span>`;
}

/** What each special mention does, as the mentions prompt says it under its name. */
export const SPECIAL_MENTION_DESCRIPTIONS: Record<SpecialMention, string> = {
  here: "Notify everyone active in this room",
  channel: "Notify everyone in this room",
  everyone: "Notify everyone in the workspace",
};

/**
 * Someone as Lexxy's mentions prompt offers them: as a mention shows them, with their username, if they
 * have one, and whether they're an AI agent, as @ember is.
 */
export interface PromptCard extends MentionCard {
  username?: string;
  agent?: boolean;
}

/**
 * Campfire's autocompletable/users/_prompt_item.html.erb: someone as Lexxy's mentions prompt offers
 * them, by their avatar and name, then their @username, if they have one, with a badge saying so after
 * an agent's, and the mention picking them writes. Unlike Campfire's, the avatar isn't a link: a click
 * anywhere on someone listed picks them, and screen readers can't reach a link in a list's option, whose
 * content ARIA makes presentational.
 */
export function mentionPromptItem(person: PromptCard): string {
  const name = htmlEscape(person.name);
  const username = person.username ? ` <span class="autocompletable__username">@${htmlEscape(person.username)}</span>` : "";
  const badge = person.agent ? ` <span class="autocompletable__badge">Agent</span>` : "";
  return `<lexxy-prompt-item search="${name}" sgid="${htmlEscape(mentionSgid(person.id))}">
  <template type="menu"><span class="autocomplete__item">${avatarTag(person.avatarUrl)}<span class="autocompletable__name">${name}</span>${username}${badge}</span></template>
  <template type="editor">${mentionContent(person)}</template>
</lexxy-prompt-item>
`;
}

/**
<<<<<<< HEAD
 * A user group as a mention shows it, as the editor keeps and the prompt's item writes one: its name in
 * place of the avatar and name a person's shows, since a group has no face of its own.
 */
export function mentionGroupContent(group: MentionUser): string {
  return `<span class="mention" sgid="${htmlEscape(mentionGroupSgid(group.id))}">${htmlEscape(group.name)}</span>`;
}

/**
 * A user group as Lexxy's mentions prompt offers it, after the people: by its name, with a badge saying
 * how many it stands for, and the mention picking it writes, whose content type and sgid name it a
 * group's, so what's sent says a group was mentioned, not a person.
 */
export function groupPromptItem(group: MentionUser, members: number): string {
  const name = htmlEscape(group.name);
  const sgid = htmlEscape(mentionGroupSgid(group.id));
  const badge = ` <span class="autocompletable__badge">${members} ${members === 1 ? "member" : "members"}</span>`;
  return `<lexxy-prompt-item search="${name}" sgid="${sgid}">
  <template type="menu"><span class="autocomplete__item"><span class="autocompletable__name">${name}</span>${badge}</span></template>
  <template type="editor" content-type="${GROUP_MENTION_CONTENT_TYPE}" sgid="${sgid}">${mentionGroupContent(group)}</template>
=======
 * A special mention as Lexxy's mentions prompt offers it, as Slack's does: its name, after an @, where a
 * person's avatar and name are, with what it does after it, and the mention picking it writes. Iconoir's
 * at sign, which the @mentions bell shows, stands in for an avatar (rich-text-editor.css).
 */
export function specialMentionPromptItem(mention: SpecialMention): string {
  return `<lexxy-prompt-item search="${mention}" sgid="${mention}">
  <template type="menu"><span class="autocomplete__item"><span class="autocompletable__at" aria-hidden="true"></span><span class="autocompletable__name">@${mention}</span> <span class="autocompletable__description">${SPECIAL_MENTION_DESCRIPTIONS[mention]}</span></span></template>
  <template type="editor">${specialMentionContent(mention)}</template>
>>>>>>> ember/v0.5.0
</lexxy-prompt-item>
`;
}

/**
 * The markup the editor opens with for a body Ember stored: each mention given the content Lexxy shows
<<<<<<< HEAD
 * it by, since Lexxy drops an attachment without content. A mention of someone `card` doesn't know, or
 * of a group `groupCard` doesn't, goes. Each link preview is written again from what it shows on
 * `host`, the one the page is served from, so that the editor no more loads an image from this Ember
 * than the message does.
 */
export function editableBody(
  parse: HtmlParser,
  stored: string,
  card: (userId: string) => MentionCard | undefined,
  host: string,
  groupCard?: (groupId: string) => MentionUser | undefined,
): string {
=======
 * it by, since Lexxy drops an attachment without content. A mention of someone `card` doesn't know goes,
 * but a room mention stays, as a private room where `room` doesn't know the room, since the room is
 * there for those who can see it. Each link preview is written again from what it shows on `host`, the
 * one the page is served from, so that the editor no more loads an image from this Ember than the
 * message does.
 */
export function editableBody(parse: HtmlParser, stored: string, card: (userId: string) => MentionCard | undefined, host: string, room: ResolveRoom = noRooms): string {
>>>>>>> ember/v0.5.0
  if (isPlainParagraph(stored)) return stored;
  const content = parse(stored, BODY);
  for (const attachment of attachmentNodes(content)) {
    if (getAttr(attachment, "content-type") === OPENGRAPH_EMBED_CONTENT_TYPE) {
      sanitizeContentAttribute(parse, attachment);
      setAttr(attachment, "content", previewContent(opengraphEmbedFromNode(parse, attachment, host)));
      continue;
    }
    const sgid = getAttr(attachment, "sgid") ?? "";
<<<<<<< HEAD
    const groupId = groupIdFromSgid(sgid);
    if (groupId !== undefined) {
      const group = groupCard?.(groupId);
      if (group) setAttr(attachment, "content", mentionGroupContent(group));
      else detach(attachment);
      continue;
    }
=======
    if (isRoomMention(attachment)) {
      setAttr(attachment, "content", roomMentionContent(room(sgid)));
      continue;
    }
    const special = specialMentionOf(sgid);
>>>>>>> ember/v0.5.0
    const userId = userIdFromSgid(sgid);
    const person = userId === undefined ? undefined : card(userId);
    if (special) setAttr(attachment, "content", specialMentionContent(special));
    else if (person) setAttr(attachment, "content", mentionContent(person));
    else detach(attachment);
  }
  return toHtml(content, { escapeAttributeBrackets: true });
}

/**
 * Stored markup with each special mention it makes that `refused` names as the text it shows, "@here" and
 * the like, as one its sender may not use is kept: it notifies nobody, and shows as what it says. Its
 * plain text stays as it was.
 */
export function specialMentionsAsText(parse: HtmlParser, stored: string, refused: readonly SpecialMention[]): string {
  if (refused.length === 0 || isPlainParagraph(stored)) return stored;
  const content = parse(stored, BODY);
  const asText = new Map<Element, Text[]>();
  for (const attachment of attachmentNodes(content)) {
    const mention = isRoomMention(attachment) ? undefined : specialMentionOf(getAttr(attachment, "sgid") ?? "");
    if (mention !== undefined && refused.includes(mention)) asText.set(attachment, [createText(`@${mention}`)]);
  }
  replaceEach(asText);
  return toHtml(content, { escapeAttributeBrackets: true });
}

/**
 * Whom markup the editor wrote mentions, once each, in order, named as their mentions show them: by the
 * text of each one's content, as the people search wrote it (`mentionContent`, `mentionGroupContent`).
 * A group's mention carries its `group` mark, so what the client says of what's written can tell one,
 * until the room says whom it stood for. Throws `ParseLimitError` past the parser's limits.
 */
export function writtenMentions(parse: HtmlParser, markup: string): MentionUser[] {
  if (isPlainParagraph(markup)) return [];
  const named = new Map<string, MentionUser>();
  for (const attachment of attachmentNodes(parse(markup, BODY))) {
<<<<<<< HEAD
    const sgid = getAttr(attachment, "sgid") ?? "";
    const groupId = groupIdFromSgid(sgid);
    const id = groupId ?? userIdFromSgid(sgid);
    if (id === undefined || named.has(id)) continue;
    const name = textContent(parse(getAttr(attachment, "content") ?? "", BODY)).trim();
    named.set(id, groupId !== undefined ? { id, name, group: true } : { id, name });
=======
    const id = isRoomMention(attachment) ? undefined : userIdFromSgid(getAttr(attachment, "sgid") ?? "");
    if (id === undefined || people.has(id)) continue;
    people.set(id, { id, name: textContent(parse(getAttr(attachment, "content") ?? "", BODY)).trim() });
>>>>>>> ember/v0.5.0
  }
  return [...named.values()];
}

/** Campfire's `avatar_tag` (users/avatars_helper.rb), without its link: an image screen readers skip. */
const avatarTag = (url: string) => `<img class="avatar" aria-hidden="true" src="${htmlEscape(url)}" width="48" height="48">`;

/** Whom a body's attachments mention, as their sgids say before anyone is looked up. */
export interface Mentions {
  /** The users their sgids name, once each. */
  userIds: string[];
  /** The special mentions they make, once each. */
  specialMentions: SpecialMention[];
}

/**
 * Every user an attachment's sgid names, in the body or in the content attachments that render
 * inside it, once each: the users to look up before resolving the body's mentions. The sgids are
 * read as parsed, character references and all. Markup past the parser's limits is skipped, since
 * `prepareBody` refuses it anyway.
 */
export function userIdsIn(parse: HtmlParser, markup: string): string[] {
<<<<<<< HEAD
  return mentionedIdsIn(parse, markup).userIds;
}

/**
 * Every user group an attachment's sgid names, the same way: the groups to look up before resolving
 * the body's mentions.
 */
export function groupIdsIn(parse: HtmlParser, markup: string): string[] {
  return mentionedIdsIn(parse, markup).groupIds;
}

/** Every user and user group a body's attachments name, once each, to look up before resolving them. */
export function mentionedIdsIn(parse: HtmlParser, markup: string): { userIds: string[]; groupIds: string[] } {
  const userIds = new Set<string>();
  const groupIds = new Set<string>();
  if (isPlainParagraph(markup)) return { userIds: [], groupIds: [] };
=======
  return mentionsIn(parse, markup).userIds;
}

/** The users `userIdsIn` finds, with the special mentions the same attachments make, once each. */
export function mentionsIn(parse: HtmlParser, markup: string): Mentions {
  const sgids = sgidsIn(parse, markup, (attachment) => !isRoomMention(attachment));
  const userIds = sgids.flatMap((sgid) => userIdFromSgid(sgid) ?? []);
  const specialMentions = sgids.flatMap((sgid) => specialMentionOf(sgid) ?? []);
  return { userIds, specialMentions };
}

/**
 * Every room a room mention's sgid names, in the body or in the content attachments that render inside
 * it, once each: the rooms to look up before resolving its room mentions, read as `userIdsIn` reads users.
 */
export function roomIdsIn(parse: HtmlParser, markup: string): string[] {
  return sgidsIn(parse, markup, isRoomMention);
}

/**
 * The sgid of every attachment `counted` counts, in the body or in the content attachments that render
 * inside it, once each.
 */
function sgidsIn(parse: HtmlParser, markup: string, counted: (attachment: Element) => boolean): string[] {
  if (isPlainParagraph(markup)) return [];
  const sgids = new Set<string>();
>>>>>>> ember/v0.5.0
  const collect = (markup: string, depth: number) => {
    let attachments: Element[];
    try {
      attachments = attachmentNodes(parse(markup, BODY));
    } catch (error) {
      if (error instanceof ParseLimitError) return;
      throw error;
    }
    for (const attachment of attachments) {
<<<<<<< HEAD
      const sgid = getAttr(attachment, "sgid") ?? "";
      const groupId = groupIdFromSgid(sgid);
      const userId = userIdFromSgid(sgid);
      if (groupId !== undefined) groupIds.add(groupId);
      else if (userId !== undefined) userIds.add(userId);
=======
      const sgid = getAttr(attachment, "sgid");
      if (sgid !== undefined && counted(attachment)) sgids.add(sgid);
>>>>>>> ember/v0.5.0
      const content = getAttr(attachment, "content");
      if (content !== undefined && depth < MAX_CONTENT_ATTACHMENT_DEPTH) collect(content, depth + 1);
    }
  };
  collect(markup, 0);
<<<<<<< HEAD
  return { userIds: [...userIds], groupIds: [...groupIds] };
=======
  return [...sgids];
>>>>>>> ember/v0.5.0
}

/**
 * `Message::Mentionee#mentioned_users`: the users the body's attachments resolve to, once each, in
 * order. Throws `ParseLimitError` past the parser's limits.
 */
export function mentionedUsers(parse: HtmlParser, markup: string, resolve: ResolveMention): MentionUser[] {
  return usersAttached(attachmentNodes(loadContent(parse, markup)), resolve);
}

/** The users attachments of a loaded body resolve to, once each, in order. */
export function usersAttached(attachments: Element[], resolve: ResolveMention): MentionUser[] {
  const users = new Map<string, MentionUser>();
  for (const node of attachments) {
    const sgid = isRoomMention(node) ? undefined : getAttr(node, "sgid");
    const user = sgid === undefined ? undefined : resolve(sgid);
    if (user && !users.has(user.id)) users.set(user.id, user);
  }
  return [...users.values()];
}

/** The special mentions attachments of a loaded body make, once each, in order. */
export function specialMentionsAttached(attachments: Element[]): SpecialMention[] {
  return [...new Set(attachments.flatMap((node) => (isRoomMention(node) ? [] : (specialMentionOf(getAttr(node, "sgid") ?? "") ?? []))))];
}
