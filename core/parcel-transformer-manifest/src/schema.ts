/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/v2/packages/transformers/webextension/src/schema.js
 * MIT License
 */

import type { FromSchema } from "json-schema-to-ts"

import {
  validateBrowserVersion,
  validateSemanticVersion
} from "./validate-version"

const stringSchema = {
  type: "string"
} as const

const booleanSchema = {
  type: "boolean"
} as const

const iconsSchema = {
  type: "object",
  properties: {},
  additionalProperties: stringSchema
} as const

const actionProps = {
  // FF only
  browser_style: booleanSchema,
  chrome_style: booleanSchema,
  // You can also have a raw string, but not in Edge, apparently...
  default_icon: {
    oneOf: [iconsSchema, stringSchema]
  },
  default_popup: stringSchema,
  default_title: stringSchema
} as const

const arraySchema = {
  type: "array",
  items: stringSchema
} as const

const browserAction = {
  type: "object",
  properties: {
    ...actionProps,
    // rest are FF only
    default_area: {
      type: "string",
      enum: ["navbar", "menupanel", "tabstrip", "personaltoolbar"]
    },
    theme_icons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          light: stringSchema,
          dark: stringSchema,
          size: {
            type: "number"
          }
        },
        additionalProperties: false,
        required: ["light", "dark", "size"]
      }
    }
  },
  additionalProperties: false
} as const

const warBase = {
  type: "object",
  properties: {
    resources: arraySchema,
    matches: arraySchema,
    extension_ids: arraySchema,
    use_dynamic_url: booleanSchema
  },
  additionalProperties: false
} as const

const commonProps = {
  $schema: stringSchema,
  name: stringSchema,
  version: {
    type: "string",
    __validate: validateSemanticVersion
  },
  default_locale: stringSchema,
  description: stringSchema,
  icons: iconsSchema,
  author: stringSchema,
  browser_specific_settings: {
    type: "object",
    properties: {},
    additionalProperties: {
      type: "object",
      properties: {}
    }
  },
  chrome_settings_overrides: {
    type: "object",
    properties: {
      homepage: stringSchema,
      search_provider: {
        type: "object",
        properties: {
          name: stringSchema,
          keyword: stringSchema,
          favicon_url: stringSchema,
          search_url: stringSchema,
          encoding: stringSchema,
          suggest_url: stringSchema,
          image_url: stringSchema,
          instant_url: stringSchema,
          search_url_post_params: stringSchema,
          suggest_url_post_params: stringSchema,
          image_url_post_params: stringSchema,
          instant_url_post_params: stringSchema,
          alternate_urls: arraySchema,
          prepopulated_id: {
            type: "number"
          },
          is_default: booleanSchema
        },
        additionalProperties: false,
        required: ["name", "search_url"]
      },
      startup_pages: arraySchema
    },
    additionalProperties: false
  },
  chrome_url_overrides: {
    type: "object",
    properties: {
      bookmarks: stringSchema,
      history: stringSchema,
      newtab: stringSchema
    },
    additionalProperties: false
  },
  commands: {
    type: "object",
    properties: {},
    additionalProperties: {
      type: "object",
      properties: {
        suggested_key: {
          type: "object",
          properties: {
            default: stringSchema,
            mac: stringSchema,
            linux: stringSchema,
            windows: stringSchema,
            chromeos: stringSchema,
            android: stringSchema,
            ios: stringSchema
          },
          additionalProperties: false
        },
        description: stringSchema,
        global: booleanSchema
      },
      additionalProperties: false
    }
  },
  content_scripts: {
    type: "array",
    items: {
      type: "object",
      properties: {
        matches: arraySchema,
        css: arraySchema,
        js: arraySchema,
        match_about_blank: booleanSchema,
        match_origin_as_fallback: booleanSchema,
        exclude_matches: arraySchema,
        include_globs: arraySchema,
        exclude_globs: arraySchema,
        run_at: {
          type: "string",
          enum: ["document_idle", "document_start", "document_end"]
        },
        all_frames: booleanSchema
      },
      additionalProperties: false,
      required: ["matches"]
    }
  },
  declarative_net_request: {
    type: "object",
    properties: {
      rule_resources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: stringSchema,
            enabled: booleanSchema,
            path: stringSchema
          },
          additionalProperties: false,
          required: ["id", "enabled", "path"]
        }
      }
    },
    additionalProperties: false,
    required: ["rule_resources"]
  },
  devtools_page: stringSchema,
  // looks to be FF only
  dictionaries: {
    type: "object",
    properties: {},
    additionalProperties: stringSchema
  },
  externally_connectable: {
    type: "object",
    properties: {
      ids: arraySchema,
      matches: arraySchema,
      accept_tls_channel_id: booleanSchema
    },
    additionalProperties: false
  },
  // These next two are where it gets a bit Chrome-y
  // (we don't include all because some have next to no actual use)
  file_browser_handlers: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: stringSchema,
        default_title: stringSchema,
        file_filters: arraySchema
      },
      additionalProperties: false,
      required: ["id", "default_title", "file_filters"]
    }
  },
  file_system_provider_capabilities: {
    type: "object",
    properties: {
      configurable: booleanSchema,
      multiple_mounts: booleanSchema,
      watchable: booleanSchema,
      source: {
        type: "string",
        enum: ["file", "device", "network"]
      }
    },
    additionalProperties: false,
    required: ["source"]
  },
  homepage_url: stringSchema,
  incognito: {
    type: "string",
    enum: ["spanning", "split", "not_allowed"]
  },
  key: stringSchema,
  minimum_chrome_version: {
    type: "string",
    __validate: validateBrowserVersion
  },
  // No NaCl modules because deprecated
  oauth2: {
    type: "object",
    properties: {
      client_id: stringSchema,
      scopes: arraySchema
    },
    additionalProperties: false
  },
  offline_enabled: booleanSchema,
  omnibox: {
    type: "object",
    properties: {},
    additionalProperties: stringSchema
  },
  optional_host_permissions: arraySchema,
  optional_permissions: arraySchema,
  // options_page is deprecated
  options_ui: {
    type: "object",
    properties: {
      browser_style: booleanSchema,
      chrome_style: booleanSchema,
      open_in_tab: booleanSchema,
      page: stringSchema
    },
    additionalProperties: false,
    required: ["page"]
  },
  permissions: arraySchema,
  // FF only, but has some use
  protocol_handlers: {
    type: "array",
    items: {
      type: "object",
      properties: {
        protocol: stringSchema,
        name: stringSchema,
        uriTemplate: stringSchema
      },
      additionalProperties: false,
      required: ["protocol", "name", "uriTemplate"]
    }
  },
  // Chrome only
  requirements: {
    type: "object",
    properties: {
      "3D": {
        type: "object",
        properties: {
          features: arraySchema
        },
        additionalProperties: false
      }
    }
  },
  short_name: stringSchema,
  // FF only, but has some use
  sidebar_action: {
    type: "object",
    properties: {
      browser_style: actionProps.browser_style,
      default_icon: actionProps.default_icon,
      default_panel: stringSchema,
      default_title: stringSchema,
      open_at_install: booleanSchema
    },
    additionalProperties: false,
    required: ["default_panel"]
  },
  storage: {
    type: "object",
    properties: {
      managed_schema: stringSchema
    },
    additionalProperties: false
  },
  theme: {
    type: "object",
    properties: {
      images: {
        type: "object",
        properties: {
          theme_frame: stringSchema,
          additional_backgrounds: arraySchema
        },
        additionalProperties: false
      },
      colors: {
        type: "object",
        properties: {
          bookmark_text: stringSchema,
          button_background_active: stringSchema,
          button_background_hover: stringSchema,
          icons: stringSchema,
          icons_attention: stringSchema,
          frame: stringSchema,
          frame_inactive: stringSchema,
          ntp_background: stringSchema,
          ntp_text: stringSchema,
          popup: stringSchema,
          popup_border: stringSchema,
          popup_highlight: stringSchema,
          popup_highlight_text: stringSchema,
          popup_text: stringSchema,
          sidebar: stringSchema,
          sidebar_border: stringSchema,
          sidebar_highlight: stringSchema,
          sidebar_highlight_text: stringSchema,
          sidebar_text: stringSchema,
          tab_background_separator: stringSchema,
          tab_background_text: stringSchema,
          tab_line: stringSchema,
          tab_loading: stringSchema,
          tab_selected: stringSchema,
          tab_text: stringSchema,
          toolbar: stringSchema,
          toolbar_bottom_separator: stringSchema,
          toolbar_field: stringSchema,
          toolbar_field_border: stringSchema,
          toolbar_field_border_focus: stringSchema,
          toolbar_field_focus: stringSchema,
          toolbar_field_highlight: stringSchema,
          toolbar_field_highlight_text: stringSchema,
          toolbar_field_separator: stringSchema,
          toolbar_field_text: stringSchema,
          toolbar_field_text_focus: stringSchema,
          toolbar_text: stringSchema,
          toolbar_top_separator: stringSchema,
          toolbar_vertical_separator: stringSchema
        },
        additionalProperties: false
      },
      properties: {
        type: "object",
        properties: {
          additional_backgrounds_alignment: arraySchema,
          additional_backgrounds_tiling: {
            type: "array",
            items: {
              type: "string",
              enum: ["no-repeat", "repeat", "repeat-x", "repeat-y"]
            }
          }
        },
        additionalProperties: false
      }
    },
    additionalProperties: false,
    required: ["colors"]
  },
  tts_engine: {
    type: "object",
    properties: {
      voices: {
        type: "array",
        items: {
          type: "object",
          properties: {
            voice_name: stringSchema,
            lang: stringSchema,
            event_type: {
              type: "string",
              enum: ["start", "word", "sentence", "marker", "end", "error"]
            }
          },
          additionalProperties: false,
          required: ["voice_name", "event_type"]
        }
      }
    },
    additionalProperties: false
  },
  update_url: stringSchema,
  user_scripts: {
    type: "object",
    properties: {
      api_script: stringSchema
    },
    additionalProperties: false
  },
  version_name: stringSchema
} as const

export const MV3Schema = {
  type: "object",
  properties: {
    ...commonProps,
    manifest_version: {
      type: "number",
      enum: [3]
    },
    action: browserAction,
    background: {
      type: "object",
      properties: {
        service_worker: stringSchema,
        type: {
          type: "string",
          enum: ["classic", "module"]
        }
      },
      additionalProperties: false,
      required: ["service_worker"]
    },
    content_security_policy: {
      type: "object",
      properties: {
        extension_pages: stringSchema,
        sandbox: stringSchema
      },
      additionalProperties: false
    },
    host_permissions: arraySchema,
    sandbox: {
      type: "object",
      properties: {
        pages: arraySchema
      },
      additionalProperties: false
    },
    web_accessible_resources: {
      type: "array",
      items: {
        oneOf: [
          { ...warBase, required: ["resources", "matches"] },
          { ...warBase, required: ["resources", "extension_ids"] }
        ]
      }
    }
  },
  required: ["manifest_version", "name", "version"]
} as const

export type MV3Data = FromSchema<typeof MV3Schema>

export const MV2Schema = {
  type: "object",
  properties: {
    ...commonProps,
    manifest_version: {
      type: "number",
      enum: [2]
    },
    background: {
      type: "object",
      properties: {
        scripts: arraySchema,
        page: stringSchema,
        persistent: booleanSchema
      },
      additionalProperties: false
    },
    browser_action: browserAction,
    content_security_policy: stringSchema,
    page_action: {
      type: "object",
      properties: {
        ...actionProps,
        // rest are FF only
        hide_matches: arraySchema,
        show_matches: arraySchema,
        pinned: booleanSchema
      },
      additionalProperties: false
    },
    sandbox: {
      type: "object",
      properties: {
        pages: arraySchema,
        content_security_policy: stringSchema
      },
      additionalProperties: false
    },
    web_accessible_resources: arraySchema
  },
  required: ["manifest_version", "name", "version"]
} as const

export type MV2Data = FromSchema<typeof MV2Schema>

export type ManifestData = MV2Data | MV3Data
