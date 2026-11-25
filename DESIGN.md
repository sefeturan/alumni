# Alumni Network — Design System

This document is the implementation-oriented design contract for the Alumni Network web experience. It complements [brand.md](brand.md), which defines brand personality and messaging.

## 1. Product goals
- Help graduates and students find one another and build professional relationships.
- Make announcements, profiles, and career opportunities easy to browse.
- Make management tasks understandable and efficient.
- Maintain consistency across landing, directory, detail, edit, and informational pages.

## 2. Foundations

### Color tokens
| Token | Value | Use |
|---|---|---|
| Brand | `#3157D5` | Primary actions, active links |
| Brand dark | `#2445B4` | Hover and pressed states |
| Ink | `#172B4D` | Headings and high-emphasis text |
| Muted | `#64748B` | Supporting copy |
| Teal | `#0F9B8E` | Positive and community accents |
| Canvas | `#F4F7FB` | Page background |
| Surface | `#FFFFFF` | Cards and forms |
| Line | `#E5EAF2` | Borders and dividers |

### Typography
- Headings: Manrope, weights 600–800.
- Body and controls: DM Sans, weights 400–700.
- Use fluid heading sizes and comfortable 1.6–1.8 body line-height.
- Keep paragraphs readable with a moderate maximum width.

### Layout and spacing
- Main content max width: approximately 1240px.
- Use responsive CSS grid/flex layouts.
- Use consistent spacing increments (4, 8, 12, 16, 24, 32, 48px).
- Cards use 18px corner radius; controls use 11px.
- Use subtle elevation, not heavy outlines or decorative shadows.

## 3. Components and behavior

### Navigation
- White, lightly translucent surface with a subtle bottom border.
- Brand remains left aligned; navigation wraps gracefully on small screens.
- Active links use the primary color and remain distinguishable without relying only on color.

### Buttons and links
- Primary buttons use brand blue with white text.
- Hover states slightly darken and lift the control.
- Provide visible keyboard focus and adequate hit targets.
- Secondary actions use neutral surfaces and borders.

### Cards
- White background, subtle line, soft shadow, consistent internal padding.
- Group related information and preserve heading-to-description hierarchy.
- Hover elevation is subtle and reduced-motion preferences are respected.

### Forms
- Labels remain visible and associated with controls.
- Inputs use full available width, consistent padding, and a clear focus ring.
- Group related fields; on mobile, multi-column forms become one column.
- Preserve native validation and existing form names/actions.

### Tables and lists
- Use clear header contrast and row separators.
- Wrap tables in horizontally scrollable containers on narrow screens.
- Keep row actions easy to locate and avoid truncating essential information.

### Feedback and status
- Pair status color with text or an icon.
- Use concise success, warning, and error messages.
- Preserve existing 404 and 5xx error handling semantics.

## 4. Page templates
- **Home:** editorial hero, concise value proposition, feature cards, alumni discovery and API demo sections.
- **About:** introduction followed by mission, capabilities, and technology sections.
- **Directory:** clear page header, registration form and user table with responsive stacking.
- **Profile detail:** focused identity header, structured profile information and obvious return/edit actions.
- **Edit forms:** narrow centered form card, grouped fields and clear save/cancel actions.
- **Announcements:** publishing form and announcement list with readable priority/category indicators.
- **Announcement detail:** comfortable reading width, metadata separated from article content.
- **404:** focused recovery panel with links to main product destinations.

## 5. Responsive behavior
- Desktop: multi-column layouts where content benefits from comparison.
- Tablet: reduce grid columns and allow navigation wrapping.
- Mobile: stack forms and cards, reduce hero typography, keep controls full-width, and enable horizontal table scrolling.
- Respect `prefers-reduced-motion`.

## 6. Accessibility
- Maintain semantic headings and landmarks.
- Keep text/background contrast legible.
- Ensure keyboard focus is visible.
- Use descriptive labels and link text.
- Do not communicate state by color alone.

## 7. Implementation
Shared tokens and cross-page component styling live in `src/styles/alumni.css`. Each HTML view loads that stylesheet and adds a page-specific body class. Existing controllers, routes, placeholders, and form actions remain the source of application behavior.

## 8. Design reference
The document organization and design-system approach were informed by [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md).
