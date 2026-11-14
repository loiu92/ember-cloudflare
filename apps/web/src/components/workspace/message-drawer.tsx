import { useRef } from "react";
import { QUICK_REACTION_COUNT, REACTIONS, type Message } from "@ember/protocol";
import type { DisplayNode } from "@ember/richtext/dom";
import { Copy, Edit, MoreHoriz, QuoteMessage, Trash } from "@/components/icons/iconoir";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { copyWithSuccess } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { copyLink, QuoteButton } from "./message-actions-menu";

/** An item of the drawer: its icon, then its name, the drawer's whole width, sized for a thumb. */
const ITEM =
  "flex h-11 w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 text-left text-sm text-message-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground [&_svg]:size-5 [&_svg]:shrink-0";

/** One of the drawer's quick reactions: the emoji, named by its title. */
const REACTION =
  "grid size-11 cursor-pointer place-items-center rounded-[10px] transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground";

interface Props {
  message: Message;
  /** What the message shows, which Quote quotes. */
  nodes: DisplayNode[];
  /** Whether Edit message and Delete message show: on your own messages, and on everyone's for administrators. */
  editable: boolean;
  /** Whether the drawer shows, as holding the message opened it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReact: (emoji: string) => void;
  /** Writes a reply in the composer, given the quote it starts with. */
  onQuote: (quote: string) => void;
  onEdit: () => void;
  /** Deletes the message, answering whether the deletion was sent. */
  onDelete: () => boolean;
  /** Opens the message's More actions panel, which holds what the drawer leaves out. */
  onMoreActions: () => void;
  /** Puts focus back on the message, as the drawer closes. */
  onReturnFocus: () => void;
}

/**
 * The message drawer, which holding a message opens on a touch screen: a grab handle, the bar's quick
 * reactions, then the message's actions, then More actions, which closes the drawer and opens the
 * message's More actions panel, so nothing a finger can't reach is lost. It slides from the bottom edge,
 * keeps clear of the home indicator, and closes on Escape or a tap on what it lays over.
 */
export function MessageDrawer({ message, nodes, editable, open, onOpenChange, onReact, onQuote, onEdit, onDelete, onMoreActions, onReturnFocus }: Props) {
  const reactions = useRef<HTMLDivElement>(null);
  // Whether More actions has just taken over, whose panel keeps the focus its first item took.
  const handedOver = useRef(false);
  // What Copy text copies: the message's plain text, which holds a bot's cards' too. A file message has none but its file's name.
  const text = message.attachment ? null : message.plainText;

  const react = (emoji: string) => {
    onReact(emoji);
    onOpenChange(false);
  };

  // Quote and Edit close the drawer too, and take focus themselves, as the composer and the editor do.
  const quote = (quoted: string) => {
    onOpenChange(false);
    onQuote(quoted);
  };

  const edit = () => {
    onOpenChange(false);
    onEdit();
  };

  // More actions asks the drawer to close; the handover happens once it's gone.
  const handOver = () => {
    handedOver.current = true;
    onOpenChange(false);
  };

  // Delete message asks first, as More actions' does.
  const remove = () => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    if (onDelete()) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // Opening puts focus on the first quick reaction; closing hands it back to the message, unless
        // what was tapped kept it, as Quote's composer or Edit's field does.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          reactions.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (handedOver.current) {
            handedOver.current = false;
            // More actions' panel opens only once the drawer is gone, whose focus trap would take the
            // focus back; its first item takes focus as the panel opens.
            event.preventDefault();
            onMoreActions();
            return;
          }
          const focused = document.activeElement;
          if (!focused || focused === document.body) {
            event.preventDefault();
            onReturnFocus();
          }
        }}
        className="mx-auto max-w-lg gap-0 rounded-t-2xl border-message-border px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <SheetTitle className="sr-only">Message actions</SheetTitle>
        <SheetDescription className="sr-only">React to, quote or change this message.</SheetDescription>
        <div aria-hidden className="mx-auto mb-1 h-1 w-9 shrink-0 rounded-full bg-border" />
        <div ref={reactions} role="group" aria-label="Quick reactions" className="flex justify-center gap-1 py-1">
          {REACTIONS.slice(0, QUICK_REACTION_COUNT).map(([emoji, title]) => (
            <button key={emoji} type="button" className={REACTION} onClick={() => react(emoji)}>
              <span aria-hidden className="text-[1.5rem] leading-normal">
                {emoji}
              </span>
              <span className="sr-only">{title}</span>
            </button>
          ))}
        </div>
        <hr className="my-1 border-message-border" />
        <div className="flex flex-col py-1">
          {/* Quoting a file message would quote nothing, as its text is empty. */}
          {!message.attachment && (
            <QuoteButton message={message} nodes={nodes} className={ITEM} onQuote={quote}>
              <QuoteMessage />
              Quote
            </QuoteButton>
          )}
          {text !== null && (
            <button type="button" className={ITEM} onClick={(event) => void copyWithSuccess(event.currentTarget, text)}>
              <Copy />
              Copy text
            </button>
          )}
          <button type="button" className={ITEM} onClick={(event) => void copyLink(event, message)}>
            <Copy />
            Copy link
          </button>
          {editable && (
            <>
              <hr className="my-1 border-message-border" />
              {/* The text of a file message, or of a bot's cards, can't be changed. */}
              {!message.attachment && !message.cards && (
                <button type="button" className={ITEM} onClick={edit}>
                  <Edit />
                  Edit message
                </button>
              )}
              <button type="button" className={cn(ITEM, "text-negative")} onClick={remove}>
                <Trash />
                Delete message
              </button>
            </>
          )}
        </div>
        <hr className="my-1 border-message-border" />
        <button type="button" className={cn(ITEM, "text-message-muted")} onClick={handOver}>
          <MoreHoriz />
          More actions
        </button>
      </SheetContent>
    </Sheet>
  );
}
