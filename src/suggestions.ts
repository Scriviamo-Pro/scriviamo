/**
 * Application-defined text suggestions. A Provider owns one trigger, such as
 * "@" or ":", and supplies Suggestion choices for the text typed after it. A
 * chosen suggestion becomes a semantic inline tag: its characters carry the
 * provider's identifier and the suggestion's identifier, so the tag survives
 * JSON, HTML and Markdown and can be recognized again when it is loaded.
 *
 *     import {Suggestions} from "scriviamo"
 *
 *     let people = new Suggestions.Provider("people", "@")
 *     people.add("ada", "Ada Lovelace")
 *     people.add("grace", "Grace Hopper")
 *     editor.suggestionProviders.add(people)
 */
import {Colors, DocumentColor, TextHost, TextStyle, Utilities} from "./internal"

export namespace Suggestions {
  /** Syntax recognized immediately before the caret, and the range a chosen suggestion replaces. */
  export class Request {
    identifier: string
    trigger: string
    query: string
    startPosition: number
    length: number

    constructor(identifier: string, trigger: string, query: string, startPosition: number, length: number) {
      this.identifier = identifier
      this.trigger = trigger
      this.query = query
      this.startPosition = Math.max(0, startPosition)
      this.length = Math.max(0, length)
    }
  }

  /**
   * One choice in the suggestion popup. caption is shown, insertText replaces the
   * matched range, filterText is matched against the query, and identifier is the
   * stable value kept with a committed tag.
   */
  export class Suggestion {
    caption: string
    insertText: string
    filterText: string
    identifier: string
    /** An icon class, such as "bi bi-person", or an image URL. */
    icon: string = ""
    /** Secondary text shown after the caption. */
    detail: string = ""
    /** Application-defined data. */
    tag: any = null

    constructor(caption: string, insertText: string = "", identifier: string = "") {
      this.caption = caption
      this.insertText = insertText.length > 0 ? insertText : caption
      this.filterText = caption
      this.identifier = identifier.length > 0 ? identifier : this.insertText
    }

    /** Fills a popup row and returns true, or returns false to use the standard row. */
    render(element: HTMLElement, selected: boolean): boolean {
      void element, selected
      return false
    }
  }

  /**
   * Recognizes one text protocol and supplies choices for it. Subclass it and
   * override match for custom syntax, suggestions for a dynamic source (it may
   * return a Promise), or commitSuggestion to control insertion.
   */
  export class Provider {
    identifier: string
    trigger: string
    /** Default colors of committed tags. */
    textColor: DocumentColor = Colors.make(0x1E, 0x40, 0xAF)
    backgroundColor: DocumentColor = Colors.make(0xDB, 0xEA, 0xFE)
    borderColor: DocumentColor = Colors.make(0x93, 0xC5, 0xFD)
    #suggestions: Array<Suggestion> = []

    constructor(identifier: string = "default", trigger: string = "") {
      this.identifier = identifier.trim().length > 0 ? identifier.trim() : "default"
      this.trigger = trigger.trim()
    }

    /**
     * Adds a choice. With a string, the popup shows caption (or value) and inserting
     * it types the trigger followed by value, so add("ada", "Ada Lovelace") inserts "@ada".
     */
    add(value: Suggestion | string, caption: string = "") {
      if (value instanceof Suggestion) {
        if (this.#suggestions.some(item => item.insertText.toLowerCase() == value.insertText.toLowerCase())) return
        this.#suggestions.push(value)
        return
      }
      let text = String(value || "").trim()
      if (this.trigger.length > 0 && text.startsWith(this.trigger)) text = text.substring(this.trigger.length)
      if (text.length == 0) return
      if (caption.trim().length == 0) caption = text
      let suggestion = new Suggestion(caption, this.trigger + text, text)
      suggestion.filterText = text
      this.add(suggestion)
    }

    get lastIndex(): number {
      return this.#suggestions.length - 1
    }

    /** The position of a suggestion, or of the first with the caption, ignoring case. */
    indexOf(suggestion: Suggestion | string): number {
      if (suggestion instanceof Suggestion) return this.#suggestions.indexOf(suggestion)
      let caption = String(suggestion || "").trim().toLowerCase()
      if (caption.length == 0) return -1
      return this.#suggestions.findIndex(item => item.caption.trim().toLowerCase() == caption)
    }

    lookup(caption: string): Suggestion | null {
      let index = this.indexOf(caption)
      return index < 0 ? null : this.#suggestions[index]
    }

    items(): Array<Suggestion> {
      return this.#suggestions.slice()
    }

    removeAt(index: number) {
      if (index >= 0 && index < this.#suggestions.length) this.#suggestions.splice(index, 1)
    }

    removeAll() {
      this.#suggestions = []
    }

    /** A request when the text before the caret ends with the trigger and a query with no spaces. */
    match(textBeforeCaret: string, caretPosition: number, host: TextHost | null): Request | null {
      void host
      if (textBeforeCaret.length == 0 || this.trigger.length == 0) return null
      let segmentStart = textBeforeCaret.length
      while (segmentStart > 0 && !Provider.isSpace(textBeforeCaret[segmentStart - 1])) segmentStart--
      let triggerIndex = textBeforeCaret.lastIndexOf(this.trigger)
      if (triggerIndex < segmentStart) return null
      let query = textBeforeCaret.substring(triggerIndex + this.trigger.length)
      return new Request(this.trigger, this.trigger, query, triggerIndex, Math.max(0, caretPosition - triggerIndex))
    }

    /** Choices for a request: those whose filter text starts with the query. */
    suggestions(request: Request, maximumResults: number = 6): Array<Suggestion> | Promise<Array<Suggestion>> {
      let result: Array<Suggestion> = []
      if (!request || request.trigger != this.trigger || maximumResults <= 0) return result
      let query = request.query.toLowerCase()
      for (let suggestion of this.#suggestions) {
        let filterText = suggestion.filterText.length > 0 ? suggestion.filterText : suggestion.caption
        if (filterText.toLowerCase().startsWith(query)) result.push(suggestion)
        if (result.length >= maximumResults) break
      }
      return result
    }

    /** Replaces the request's range with the suggestion as a tag, and returns the caret position after it. */
    commitSuggestion(host: TextHost, request: Request, suggestion: Suggestion, currentStyle: TextStyle | null): number {
      if (!host || !request || !suggestion || suggestion.insertText.length == 0) return -1
      let style = currentStyle ? currentStyle.clone() : new TextStyle()
      style.suggestionProviderIdentifier = this.identifier
      style.suggestionIdentifier = suggestion.identifier
      style.suggestionTextColor = Colors.clone(this.textColor)
      style.suggestionBackgroundColor = Colors.clone(this.backgroundColor)
      style.suggestionBorderColor = Colors.clone(this.borderColor)
      host.rich.remove(request.startPosition, request.startPosition + request.length)
      host.rich.insert(request.startPosition, suggestion.insertText, style)
      return request.startPosition + suggestion.insertText.length
    }

    static isSpace(character: string): boolean {
      return character == " " || character == "\t" || character == "\n" || character == "\r" || character == " " || character == " "
    }
  }

  /**
   * Inserts emoji by shortcode: typing a colon and part of a name, such as ":thu",
   * lists matching emoji, and choosing one replaces the shortcode with the emoji
   * as ordinary text. Every editor starts with one, identified as "emoji".
   */
  export class EmojiProvider extends Provider {
    static #names: Array<string> = []
    static #emoji: Array<string> = []
    static #keywords: Array<string> = []

    constructor() {
      super("emoji", ":")
    }

    static #ensureTable() {
      if (EmojiProvider.#names.length > 0) return
      // Each entry is a common shortcode, its emoji, and any search keywords.
      let entries = [
          "smile 😄 happy", "grin 😁 happy", "joy 😂 lol haha lmao laugh tears", "rofl 🤣 lol lmao laugh rolling",
          "smiley 😃 happy", "sweat_smile 😅", "laughing 😆 lol haha laugh satisfied", "wink 😉", "blush 😊", "yum 😋",
          "sunglasses 😎 cool", "heart_eyes 😍 love", "kissing_heart 😘 love kiss", "slightly_smiling_face 🙂 happy",
          "upside_down_face 🙃", "hugs 🤗 hug", "star_struck 🤩", "thinking 🤔 hmm think", "raised_eyebrow 🤨",
          "neutral_face 😐", "expressionless 😑", "no_mouth 😶", "roll_eyes 🙄", "smirk 😏", "persevere 😣",
          "disappointed_relieved 😥", "open_mouth 😮 wow surprised", "zipper_mouth_face 🤐", "hushed 😯", "sleepy 😪",
          "tired_face 😫", "sleeping 😴", "relieved 😌", "stuck_out_tongue 😛", "stuck_out_tongue_winking_eye 😜",
          "drooling_face 🤤", "unamused 😒", "sweat 😓", "pensive 😔 sad", "confused 😕", "astonished 😲 wow surprised",
          "slightly_frowning_face 🙁", "confounded 😖", "disappointed 😞 sad", "worried 😟", "triumph 😤", "cry 😢 sad tear",
          "sob 😭 sad cry", "frowning 😦", "anguished 😧", "fearful 😨", "weary 😩", "exploding_head 🤯 mind blown omg",
          "grimacing 😬", "cold_sweat 😰", "scream 😱 omg shocked", "flushed 😳", "zany_face 🤪", "dizzy_face 😵",
          "rage 😡 angry mad", "angry 😠 mad", "mask 😷", "face_with_thermometer 🤒", "nauseated_face 🤢",
          "sneezing_face 🤧", "innocent 😇", "cowboy_hat_face 🤠", "partying_face 🥳 party celebrate", "pleading_face 🥺",
          "nerd_face 🤓", "monocle_face 🧐", "shushing_face 🤫", "skull 💀", "ghost 👻", "alien 👽", "robot 🤖", "poop 💩",
          "clown_face 🤡", "see_no_evil 🙈", "hear_no_evil 🙉", "speak_no_evil 🙊", "wave 👋 hello hi bye", "raised_hand ✋",
          "ok_hand 👌 ok perfect", "v ✌️", "crossed_fingers 🤞", "love_you_gesture 🤟", "metal 🤘", "call_me_hand 🤙",
          "point_left 👈", "point_right 👉", "point_up ☝️", "point_down 👇", "thumbsup 👍 yes ok like approve",
          "+1 👍 yes ok like approve", "thumbsdown 👎 no dislike", "-1 👎 no dislike", "fist ✊", "punch 👊",
          "clap 👏 applause bravo", "raised_hands 🙌", "open_hands 👐", "handshake 🤝", "pray 🙏 thanks please",
          "writing_hand ✍️", "muscle 💪 strong flex", "eyes 👀 look see", "brain 🧠", "heart ❤️ love", "orange_heart 🧡",
          "yellow_heart 💛", "green_heart 💚", "blue_heart 💙", "purple_heart 💜", "black_heart 🖤", "broken_heart 💔",
          "sparkling_heart 💖", "two_hearts 💕", "100 💯 perfect hundred", "boom 💥", "collision 💥", "fire 🔥 hot lit",
          "sparkles ✨", "star ⭐", "star2 🌟", "zap ⚡", "sunny ☀️", "cloud ☁️", "umbrella ☔", "snowflake ❄️",
          "rainbow 🌈", "ocean 🌊", "earth_americas 🌎", "rocket 🚀 launch ship", "airplane ✈️", "car 🚗", "bike 🚲",
          "house 🏠", "office 🏢", "tada 🎉 party celebrate congrats hooray", "confetti_ball 🎊 party celebrate",
          "balloon 🎈", "gift 🎁", "trophy 🏆", "medal 🏅", "soccer ⚽", "basketball 🏀", "dart 🎯", "video_game 🎮",
          "musical_note 🎵", "headphones 🎧", "art 🎨", "camera 📷", "movie_camera 🎥", "tv 📺", "computer 💻", "keyboard ⌨️",
          "iphone 📱", "phone ☎️", "bulb 💡 idea", "battery 🔋", "electric_plug 🔌", "mag 🔍", "lock 🔒", "unlock 🔓",
          "key 🔑", "hammer 🔨", "wrench 🔧", "gear ⚙️", "link 🔗", "paperclip 📎", "pushpin 📌", "scissors ✂️",
          "pencil2 ✏️", "memo 📝", "book 📖", "books 📚", "bookmark 🔖", "calendar 📅", "date 📅", "clipboard 📋",
          "file_folder 📁", "chart_with_upwards_trend 📈", "chart_with_downwards_trend 📉", "bar_chart 📊", "email 📧",
          "envelope ✉️", "inbox_tray 📥", "outbox_tray 📤", "package 📦", "bell 🔔", "loudspeaker 📢", "speech_balloon 💬",
          "thought_balloon 💭", "hourglass ⌛", "alarm_clock ⏰", "stopwatch ⏱️", "moneybag 💰", "dollar 💵",
          "credit_card 💳", "gem 💎", "coffee ☕ cafe morning", "tea 🍵", "beer 🍺 cheers drink",
          "wine_glass 🍷 cheers drink", "pizza 🍕", "hamburger 🍔", "cake 🍰", "apple 🍎", "avocado 🥑", "seedling 🌱",
          "evergreen_tree 🌲", "cactus 🌵", "four_leaf_clover 🍀", "rose 🌹", "sunflower 🌻", "cherry_blossom 🌸", "dog 🐶",
          "cat 🐱", "unicorn 🦄", "bug 🐛", "bee 🐝", "turtle 🐢", "snake 🐍", "octopus 🐙", "whale 🐳", "penguin 🐧",
          "white_check_mark ✅ done yes check", "heavy_check_mark ✔️ done check", "ballot_box_with_check ☑️",
          "x ❌ no wrong cancel", "negative_squared_cross_mark ❎", "warning ⚠️ caution", "no_entry ⛔",
          "no_entry_sign 🚫", "question ❓", "exclamation ❗", "bangbang ‼️", "information_source ℹ️", "arrow_right ➡️",
          "arrow_left ⬅️", "arrow_up ⬆️", "arrow_down ⬇️", "arrows_counterclockwise 🔄", "recycle ♻️", "red_circle 🔴",
          "green_circle 🟢", "yellow_circle 🟡", "large_blue_circle 🔵", "white_circle ⚪", "black_circle ⚫",
          "triangular_flag_on_post 🚩", "checkered_flag 🏁", "construction 🚧", "rotating_light 🚨", "new 🆕", "free 🆓",
          "cool 🆒", "ok 🆗", "sos 🆘", "copyright ©️", "registered ®️", "tm ™️", "shrug 🤷 dunno whatever",
          "facepalm 🤦 doh"
      ]
      entries.forEach(entry => {
        let fields = entry.split(" ")
        EmojiProvider.#names.push(fields[0])
        EmojiProvider.#emoji.push(fields[1])
        // Spaces around the keywords let a search match the start of any of them.
        EmojiProvider.#keywords.push(` ${fields.slice(2).join(" ")} `)
      })
    }

    static #isNameCharacter(character: string): boolean {
      return /^[A-Za-z0-9_+\-]$/.test(character)
    }

    /**
     * A request when the text before the caret is a colon that starts a word,
     * followed by at least two shortcode characters, so times such as 10:30 and
     * labels such as "Note:" don't open the popup.
     */
    match(textBeforeCaret: string, caretPosition: number, host: TextHost | null): Request | null {
      void host
      let nameStart = textBeforeCaret.length
      while (nameStart > 0 && EmojiProvider.#isNameCharacter(textBeforeCaret[nameStart - 1])) nameStart--
      if (nameStart == 0 || textBeforeCaret[nameStart - 1] != this.trigger) return null
      let colonIndex = nameStart - 1
      if (colonIndex > 0) {
        let before = textBeforeCaret[colonIndex - 1]
        if (!Provider.isSpace(before) && before != "(") return null
      }
      let query = textBeforeCaret.substring(nameStart)
      if (query.length < 2) return null
      return new Request(this.trigger, this.trigger, query, colonIndex, Math.max(0, caretPosition - colonIndex))
    }

    /** Shortcodes that start with the query, then those with a keyword that does, then those containing it. */
    suggestions(request: Request, maximumResults: number = 6): Array<Suggestion> {
      let result: Array<Suggestion> = []
      if (!request || request.trigger != this.trigger || maximumResults <= 0) return result
      EmojiProvider.#ensureTable()
      let query = request.query.toLowerCase()
      let names = EmojiProvider.#names
      let listed = new Set<number>()
      for (let pass = 0; pass < 3; pass++) {
        for (let index = 0; index < names.length; index++) {
          if (listed.has(index)) continue
          let name = names[index]
          let matches = pass == 0 ? name.startsWith(query) : (pass == 1 ? EmojiProvider.#keywords[index].indexOf(` ${query}`) >= 0 : name.indexOf(query) >= 0)
          if (!matches) continue
          listed.add(index)
          let emoji = EmojiProvider.#emoji[index]
          let suggestion = new Suggestion(`${emoji}  :${name}:`, emoji, name)
          suggestion.filterText = name
          result.push(suggestion)
          if (result.length >= maximumResults) return result
        }
      }
      return result
    }

    /** The emoji is ordinary text in the current style, not a tag. */
    commitSuggestion(host: TextHost, request: Request, suggestion: Suggestion, currentStyle: TextStyle | null): number {
      if (!host || !request || !suggestion || suggestion.insertText.length == 0) return -1
      let style = currentStyle ? currentStyle.clone() : new TextStyle()
      style.suggestionProviderIdentifier = ""
      style.suggestionIdentifier = ""
      host.rich.remove(request.startPosition, request.startPosition + request.length)
      host.rich.insert(request.startPosition, suggestion.insertText, style)
      return request.startPosition + suggestion.insertText.length
    }
  }
}

/**
 * The editor's suggestion providers, keyed by identifier, in the order the
 * editor asks them. A node's own suggestionProvider takes priority over these.
 */
export class SuggestionProviders {
  #owner: any
  #items: Array<Suggestions.Provider> = []

  constructor(owner: any) {
    this.#owner = owner
  }

  get owner(): any {
    return this.#owner
  }

  #indexOfIdentifier(identifier: string): number {
    identifier = String(identifier || "").trim()
    return this.#items.findIndex(item => item.identifier == identifier)
  }

  /** Adds a provider to the end, replacing one with the same identifier in place. */
  add(item: Suggestions.Provider) {
    if (!item) return
    let existing = this.#indexOfIdentifier(item.identifier)
    if (existing >= 0) {
      this.#items[existing] = item
    } else {
      this.#items.push(item)
    }
  }

  /** Inserts a provider at a position, removing one with the same identifier first. */
  addAt(index: number, item: Suggestions.Provider) {
    if (!item) return
    let existing = this.#indexOfIdentifier(item.identifier)
    if (existing >= 0) this.#items.splice(existing, 1)
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item)
  }

  indexOf(item: Suggestions.Provider): number {
    return this.#items.indexOf(item)
  }

  item(identifier: string): Suggestions.Provider | null {
    let index = this.#indexOfIdentifier(identifier)
    return index < 0 ? null : this.#items[index]
  }

  itemAt(index: number): Suggestions.Provider | null {
    return this.#items[index] || null
  }

  items(): Array<Suggestions.Provider> {
    return this.#items.slice()
  }

  get lastIndex(): number {
    return this.#items.length - 1
  }

  remove(item: Suggestions.Provider | string) {
    this.removeAt(typeof item == "string" ? this.#indexOfIdentifier(item) : this.#items.indexOf(item))
  }

  removeAt(index: number) {
    if (index >= 0 && index < this.#items.length) this.#items.splice(index, 1)
  }

  removeAll() {
    this.#items = []
  }
}
