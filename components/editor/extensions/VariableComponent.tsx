'use client';

import { NodeViewWrapper } from '@tiptap/react';
import React from 'react';

export const VariableComponent = (props: any) => {
  const { node } = props;
  const { name, value, label } = node.attrs;

  return (
    <NodeViewWrapper as="span" className="variable-chip">
      {value || `[${label || name}]`}
    </NodeViewWrapper>
  );
};
