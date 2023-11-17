// Pass props to your component by passing an `args` object to your story
//
// ```tsx
// export const Primary: Story = {
//  args: {
//    propName: propValue
//  }
// }
// ```
//
// See https://storybook.js.org/docs/react/writing-stories/args.

import type { Meta, StoryObj } from '@storybook/react'

import UserForm from './UserForm'

const meta: Meta<typeof UserForm> = {
  component: UserForm,
}

export default meta

type Story = StoryObj<typeof UserForm>

export const Primary: Story = {}
