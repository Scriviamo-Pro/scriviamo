/**
 * Scriviamo: the base package. Import this module, then any add-ons;
 * each add-on registers its node types with Editor when it is imported.
 */
import {CodeBlockNode, DividerNode, Editor, HeadingNode, ImageNode, ListExtension, ListNode, QuoteNode, TableNode, TextNode} from "./internal"

export * from "./internal"

// The node types every editor has. Add-ons register theirs between these orders.
Editor.registerNodeType(TextNode, 10)
Editor.registerNodeType(HeadingNode, 20)
Editor.registerNodeType(ListNode, 30)
Editor.registerNodeType(QuoteNode, 40)
Editor.registerNodeType(CodeBlockNode, 60)
Editor.registerNodeType(TableNode, 70)
Editor.registerNodeType(ImageNode, 90)
Editor.registerNodeType(DividerNode, 140)
Editor.registerExtension(ListExtension)
