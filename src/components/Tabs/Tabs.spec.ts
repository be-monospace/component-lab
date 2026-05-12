import { defineSpec } from '../../lib/spec';
import type { TabsProps } from './Tabs';

export default defineSpec<Pick<TabsProps, 'variant' | 'value' | 'defaultValue' | 'onValueChange'>>({
  component: 'Tabs',
  reactName: 'Tabs',
  import: '@component-lab/core',
  figmaNodeId: 'REPLACE_ME',
  figmaUrl: 'https://www.figma.com/design/<file-key>/?node-id=<node-id>',

  description:
    'Tabbed navigation. Minimal underlines the active tab on a shared baseline; Solid fills the active tab.',

  props: {
    variant: {
      type: 'enum',
      values: ['minimal', 'solid'] as const,
      default: 'minimal',
      description: 'Visual treatment of the selected tab.',
      figma: { axis: 'Variant', map: { Minimal: 'minimal', Solid: 'solid' } },
    },
    value: {
      type: 'string',
      description: 'Controlled selected value.',
      figma: { axis: null },
    },
    defaultValue: {
      type: 'string',
      description: 'Uncontrolled initial value.',
      figma: { axis: null },
    },
    onValueChange: {
      type: 'callback',
      description: 'Fires when the user selects a different tab.',
      figma: { axis: null },
    },
  },

  figmaInternalAxes: ['State', 'Is Selected'],

  composition: {
    children: [{ component: 'Tab', role: 'tab' }],
  },

  tokens: {
    background: [
      'tabs-bg-default',
      'tabs-bg-hover',
      'tabs-bg-selected',
      'tabs-bg-disabled',
    ],
    label: [
      'tabs-label-default',
      'tabs-label-selected',
      'tabs-label-disabled',
    ],
    border: [
      'tabs-border-default',
      'tabs-border-selected',
      'tabs-border-disabled',
    ],
    space: [
      'space-tabs-padding-x',
      'space-tabs-padding-y',
      'space-tabs-gap',
      'space-tabs-indicator',
    ],
    typography: ['typography-label'],
  },

  accessibility: {
    pattern: 'WAI-ARIA Tabs',
    roleRoot: 'tablist',
    roleItem: 'tab',
    keyboard: {
      'ArrowLeft/ArrowRight': 'Walk neighbour tabs with wrap.',
      'Home/End': 'Jump to first / last tab.',
      'Space/Enter': 'Select the focused tab (default browser behaviour).',
    },
    requiredAttrs: ['aria-selected', 'aria-controls', 'aria-disabled'],
  },
});
