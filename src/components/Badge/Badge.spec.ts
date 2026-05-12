import { defineSpec } from '../../lib/spec';
import type { BadgeProps } from './Badge';

export default defineSpec<Pick<BadgeProps, 'size' | 'status' | 'label' | 'showIcon'>>({
  component: 'Badge',
  reactName: 'Badge',
  import: '@component-lab/core',
  figmaNodeId: 'REPLACE_ME',
  figmaUrl: 'https://www.figma.com/design/<file-key>/?node-id=<node-id>',

  description:
    'Display-only element used to indicate status. Pairs a status colour with a short label and an optional matching icon. Non-interactive.',

  props: {
    size: {
      type: 'enum',
      values: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
      default: 'md',
      description: 'Overall badge size. Drives padding, label typography, icon size and gap.',
      figma: {
        axis: 'Size',
        map: { 'X-Small': 'xs', Small: 'sm', Medium: 'md', Large: 'lg', 'X-Large': 'xl' },
      },
    },
    status: {
      type: 'enum',
      values: ['neutral', 'info', 'success', 'warning', 'danger'] as const,
      default: 'neutral',
      description: 'Intent. Drives background, label colour, default icon, and icon colour.',
      figma: {
        axis: 'Status',
        map: {
          Neutral: 'neutral',
          Info: 'info',
          Success: 'success',
          Warning: 'warning',
          Danger: 'danger',
        },
      },
    },
    label: {
      type: 'string',
      description: 'Text shown inside the badge.',
      required: true,
      figma: { axis: null },
    },
    showIcon: {
      type: 'boolean',
      default: true,
      description: 'When true, shows the status-matched icon to the left of the label.',
      figma: { axis: 'Has icon', map: { 'true': 'icon visible', 'false': 'icon hidden' } },
    },
  },

  figmaInternalAxes: [],

  composition: {},

  tokens: {
    background: ['badge-bg-neutral', 'badge-bg-info', 'badge-bg-success', 'badge-bg-warning', 'badge-bg-danger'],
    label: ['badge-label-neutral', 'badge-label-info', 'badge-label-success', 'badge-label-warning', 'badge-label-danger'],
    icon: ['badge-icon-neutral', 'badge-icon-info', 'badge-icon-success', 'badge-icon-warning', 'badge-icon-danger'],
    space: [
      'space-badge-xs-padding-x', 'space-badge-xs-padding-y', 'space-badge-xs-gap',
      'space-badge-sm-padding-x', 'space-badge-sm-padding-y', 'space-badge-sm-gap',
      'space-badge-md-padding-x', 'space-badge-md-padding-y', 'space-badge-md-gap',
      'space-badge-lg-padding-x', 'space-badge-lg-padding-y', 'space-badge-lg-gap',
      'space-badge-xl-padding-x', 'space-badge-xl-padding-y', 'space-badge-xl-gap',
    ],
    typography: ['typography-badge-xs', 'typography-badge-sm', 'typography-badge-md', 'typography-badge-lg', 'typography-badge-xl'],
    radius: ['radius-badge'],
  },

  accessibility: {
    pattern: 'WAI-ARIA Status (display-only)',
    roleRoot: 'status',
    keyboard: {},
    requiredAttrs: ['role', 'aria-label'],
  },
});
