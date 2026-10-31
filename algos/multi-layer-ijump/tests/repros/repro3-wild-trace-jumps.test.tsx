import { getSimpleRouteJson } from "solver-utils"
import { test, expect } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { getDebugSvg } from "../../../infinite-grid-ijump-astar/tests/fixtures/get-debug-svg"
import { MultilayerIjump } from "../../MultilayerIjump"

test("repro3: remove wild trace jumps during obstacle evasion (#92)", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="40mm" height="30mm" routingDisabled>
      <chip name="U1" pcbX={-6} pcbY={0}>
        <footprint>
          <smtpad
            pcbX={0}
            pcbY={0}
            shape="rect"
            width="1mm"
            height="1mm"
            layer="top"
            portHints={["pin1"]}
          />
        </footprint>
      </chip>
      <chip name="U2" pcbX={6} pcbY={0}>
        <footprint>
          <smtpad
            pcbX={0}
            pcbY={0}
            shape="rect"
            width="1mm"
            height="1mm"
            layer="top"
            portHints={["pin1"]}
          />
        </footprint>
      </chip>
      <chip name="Obs1" pcbX={0} pcbY={0}>
        <footprint>
          <smtpad
            pcbX={0}
            pcbY={0}
            shape="rect"
            width="4mm"
            height="2mm"
            layer="top"
            portHints={["pin1"]}
          />
        </footprint>
      </chip>
      <chip name="Obs2" pcbX={0} pcbY={1.8}>
        <footprint>
          <smtpad
            pcbX={0}
            pcbY={0}
            shape="rect"
            width="4mm"
            height="2mm"
            layer="top"
            portHints={["pin1"]}
          />
        </footprint>
      </chip>
      <chip name="Obs3" pcbX={0} pcbY={-1.8}>
        <footprint>
          <smtpad
            pcbX={0}
            pcbY={0}
            shape="rect"
            width="4mm"
            height="2mm"
            layer="top"
            portHints={["pin1"]}
          />
        </footprint>
      </chip>
      <chip name="ObsDistant" pcbX={-15} pcbY={2}>
        <footprint>
          <smtpad
            pcbX={0}
            pcbY={0}
            shape="rect"
            width="2mm"
            height="2mm"
            layer="top"
            portHints={["pin1"]}
          />
        </footprint>
      </chip>
      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
    </board>,
  )

  const inputCircuitJson = circuit.getCircuitJson()
  const input = getSimpleRouteJson(inputCircuitJson, { layerCount: 2 })

  const autorouter = new MultilayerIjump({
    input,
    OBSTACLE_MARGIN: 0.15,
    marginsWithCosts: [{ margin: 0.15, enterCost: 0, travelCostFactor: 1 }],
    isRemovePathLoopsEnabled: false,
    debug: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  expect(solution).toHaveLength(1)

  // Verify there are no wild trace jumps towards the distant obstacle (-15mm)
  const route = solution[0].route
  for (const point of route) {
    expect(point.x).toBeGreaterThan(-10)
  }

  expect(
    getDebugSvg({ inputCircuitJson, autorouter, solution }),
  ).toMatchSvgSnapshot(import.meta.path)
})
