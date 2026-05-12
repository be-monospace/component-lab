import { defineSpec } from '../../lib/spec';
import type { AlertProps } from './Alert';

export default defineSpec<Pick<AlertProps, 'variant' | 'status' | 'title' | 'onDismiss'>>({
  component: 'Alert',
  reactName: 'Alert',
  import: '@component-lab/core',
  figmaNodeId: 'REPLACE_ME',
  figmaUrl: 'https://www.figma.com/design/<file-key>/?node-id=<node-id>',

  description:
    'Notification surface for system messages. Box for inline use within content; Header for prominent top-of-section banners. Status colour communicates intent.',

  props: {
    variant: {
      type: 'enum',
      values: ['box', 'header'] as const,
      default: 'box',
      description: 'Visual treatment. Box for inline use, Header for prominent banners.',
      figma: { axis: 'Variant', map: { Box: 'box', Header: 'header' } },
    },
    status: {
      type: 'enum',
      values: ['neutral', 'info', 'success', 'warning', 'danger'] as const,
      default: 'neutral',
      description: 'Intent. Drives background, border, headline, copy, and the default icon.',
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
    title: {
      type: 'string',
      description: 'Headline shown next to the icon. Optional.',
      figma: { axis: null },
    },
    onDismiss: {
      type: 'callback',
      description:
        'Called when the dismiss button is clicked. Presence of this prop makes the alert dismissible.',
      figma: { axis: 'Has dismiss', map: { 'true': '(callback supplied)', 'false': '(omitted)' } },
    },
  },

  figmaInternalAxes: [],

  composition: {},

  tokens: {
    background: [
      'alert-bg-neutral',
      'alert-bg-neutral-strong',
      'alert-bg-info',
      'alert-bg-info-strong',
      'alert-bg-success',
      'alert-bg-success-strong',
      'alert-bg-warning',
      'alert-bg-warning-strong',
      'alert-bg-danger',
      'alert-bg-danger-strong',
    ],
    border: [
      'alert-border-neutral',
      'alert-border-info',
      'alert-border-success',
      'alert-border-warning',
      'alert-border-danger',
    ],
    text: ['alert-text-on-subtle', 'alert-text-on-strong'],
    icon: [
      'alert-icon-neutral',
      'alert-icon-info',
      'alert-icon-success',
      'alert-icon-warning',
      'alert-icon-danger',
      'alert-icon-on-strong',
    ],
    space: [
      'space-alert-padding-x',
      'space-alert-padding-y',
      'space-alert-gap-icon-headline',
      'space-alert-gap-headline-body',
      'space-alert-gap-body-actions',
    ],
    typography: ['typography-heading-sm', 'typography-body-sm'],
    radius: ['radius-alert'],
  },

  accessibility: {
    pattern: 'WAI-ARIA Status / Alert',
    roleRoot: 'status',
    keyboard: {
      'Tab': 'Focuses the dismiss button when dismissible.',
      'Enter/Space': 'Activates the dismiss button when focused.',
    },
    requiredAttrs: ['role', 'aria-live'],
  },
});
