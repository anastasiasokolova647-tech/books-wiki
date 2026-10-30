    posArray.push({
      component,
      priority: layoutDefaults?.defaultPriority ?? 50,
    })
  }

  // Sort by priority and resolve groups
  const result: Partial<FullPageLayout> = {}

  for (const [position, items] of Object.entries(positions)) {
    items.sort((a, b) => a.priority - b.priority)

    const resolved = resolveGroups(items, layoutConfig.groups ?? {})
    const key = position as keyof Pick<
      FullPageLayout,
      "header" | "left" | "right" | "beforeBody" | "afterBody" | "footer"
    >
    ;(result as Record<string, QuartzComponent[]>)[key] = resolved
  }

  return result
}

/** @internal Exported for testing only. */
export function resolveGroups(
  items: {
    component: QuartzComponent
    priority: number
    group?: string
    groupOptions?: PluginLayoutDeclaration["groupOptions"]
  }[],
  groups: Record<string, FlexGroupConfig>,
): QuartzComponent[] {
  // Collect grouped components and track the effective priority for each group.
  // Effective priority = explicit group config priority ?? first member's priority.
  const groupedComponents = new Map<
    string,
    { component: QuartzComponent; groupOptions?: PluginLayoutDeclaration["groupOptions"] }[]
  >()
  const groupPriority = new Map<string, number>()

  for (const item of items) {
    if (item.group) {
      if (!groupedComponents.has(item.group)) {
        groupedComponents.set(item.group, [])
        // Use explicit group priority from config if set, otherwise fall back to first member's priority
        const groupConfig = groups[item.group]
        groupPriority.set(item.group, groupConfig?.priority ?? item.priority)
      }
      const groupMembers = groupedComponents.get(item.group)
      if (groupMembers) {
        groupMembers.push({
          component: item.component,
          groupOptions: item.groupOptions,
        })
      }
    }
  }

  // Build a unified list of renderable entries (ungrouped components + flex groups),
  // each with a priority, so we can sort them together.
  type RenderEntry = { priority: number; component: QuartzComponent }
  const entries: RenderEntry[] = []
  const processedGroups = new Set<string>()

  for (const item of items) {
    if (item.group) {
      // Only emit the flex group once (on first encounter)
      if (processedGroups.has(item.group)) continue
      processedGroups.add(item.group)

      const members = groupedComponents.get(item.group)
      if (!members) continue
      const groupConfig = groups[item.group] ?? {}

      const flexComponents = members.map((m) => ({
        Component: m.component,
        grow: m.groupOptions?.grow,
        shrink: m.groupOptions?.shrink,
        basis: m.groupOptions?.basis,
        order: m.groupOptions?.order,
        align: m.groupOptions?.align,
        justify: m.groupOptions?.justify,
      }))

      const flexComponent = Flex({
        components: flexComponents,
        direction: groupConfig.direction ?? "row",
        wrap: groupConfig.wrap,
        gap: groupConfig.gap ?? "1rem",
      }) as QuartzComponent

      entries.push({ priority: groupPriority.get(item.group) ?? 50, component: flexComponent })
    } else {
      entries.push({ priority: item.priority, component: item.component })
    }
  }

  // Stable sort by priority (items already arrive sorted, so equal priorities preserve order)
  entries.sort((a, b) => a.priority - b.priority)

  return entries.map((e) => e.component)
}

function applyDisplayWrapper(
  component: QuartzComponent,
  display: "mobile-only" | "desktop-only",
): QuartzComponent {
  if (display === "mobile-only") {
    return MobileOnly(component) as QuartzComponent
  } else {
    return DesktopOnly(component) as QuartzComponent
  }
}

function applyConditionWrapper(component: QuartzComponent, conditionName: string): QuartzComponent {
  const predicate = getCondition(conditionName)
  if (!predicate) {
    console.warn(
      styleText("yellow", `⚠`) +
        ` Unknown condition "${conditionName}". Component will always render.`,
    )
    return component
  }

  return ConditionalRender({
    component,
    condition: predicate,
      }) as QuartzComponent
}
