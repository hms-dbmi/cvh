import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/datasets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/datasets"!</div>
}
