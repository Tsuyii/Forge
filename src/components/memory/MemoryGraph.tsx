import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { MemoryNote } from '../../types/memory'

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: 'workspace' | 'session' | 'agent'
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
}

const NODE_COLORS: Record<GraphNode['type'], string> = {
  workspace: '#e2e8f0',
  session:   '#4a9eff',
  agent:     '#f59e0b',
}

const NODE_RADII: Record<GraphNode['type'], number> = {
  workspace: 12,
  session:   8,
  agent:     6,
}

interface Props {
  notes: MemoryNote[]
}

export function MemoryGraph({ notes }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 500

    // Build nodes & links
    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

    const workspaceIds = new Set<string>()
    const agentIds = new Set<string>()

    notes.forEach((note) => {
      // Workspace node
      const wsNodeId = `ws-${note.workspaceId}`
      if (!workspaceIds.has(wsNodeId)) {
        workspaceIds.add(wsNodeId)
        nodes.push({ id: wsNodeId, label: note.workspaceName, type: 'workspace' })
      }

      // Session node
      const sessionNodeId = `session-${note.id}`
      nodes.push({ id: sessionNodeId, label: note.title, type: 'session' })

      // Workspace → Session edge
      links.push({ source: wsNodeId, target: sessionNodeId })

      // Agent nodes
      note.agents.forEach((agent) => {
        const agentNodeId = `agent-${agent}`
        if (!agentIds.has(agentNodeId)) {
          agentIds.add(agentNodeId)
          nodes.push({ id: agentNodeId, label: agent, type: 'agent' })
        }
        links.push({ source: sessionNodeId, target: agentNodeId })
      })
    })

    if (nodes.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#737373')
        .attr('font-size', 13)
        .text('No memory notes yet — save a session to see connections')
      return
    }

    // Zoom container
    const g = svg.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(20))

    // Links
    const link = g
      .append('g')
      .attr('stroke', '#2e2e2e')
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(links)
      .join('line')

    // Node groups
    const node = g
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // Circles
    node
      .append('circle')
      .attr('r', (d) => NODE_RADII[d.type])
      .attr('fill', (d) => NODE_COLORS[d.type])
      .attr('stroke', (d) => {
        if (d.type === 'workspace') return '#94a3b8'
        if (d.type === 'session') return '#2563eb'
        return '#d97706'
      })
      .attr('stroke-width', 1.5)

    // Labels
    node
      .append('text')
      .text((d) => d.label.length > 16 ? d.label.slice(0, 15) + '…' : d.label)
      .attr('x', 0)
      .attr('y', (d) => NODE_RADII[d.type] + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#a0a0a0')
      .attr('font-size', 10)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => {
      simulation.stop()
    }
  }, [notes])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: 'var(--bg)', cursor: 'grab' }}
    />
  )
}
