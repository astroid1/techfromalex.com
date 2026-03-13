"use client";

import * as runtime from "react/jsx-runtime";
import { mdxComponents } from "./mdx-components";

function useMDXComponent(code: string) {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
}

export function MdxContent({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  return <Component components={mdxComponents} />;
}
