import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ApiParamsTableNode } from "@/components/docs/nodes/ApiParamsTableNode";
import { ApiExampleNode } from "@/components/docs/nodes/ApiExampleNode";

export const DOCS_LEXICAL_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  ApiParamsTableNode,
  ApiExampleNode,
];
