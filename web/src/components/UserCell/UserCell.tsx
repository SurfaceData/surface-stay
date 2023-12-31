import type { FindUserQuery, FindUserQueryVariables } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { useMutation } from '@redwoodjs/web'
import { Link, routes } from '@redwoodjs/router'

export const QUERY = gql`
  query FindUserQuery($id: Int!) {
    user: user(id: $id) {
      id
      name
      email
      roles
      trustStatus
    }
  }
`
const DELETE_MUTATION = gql`
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id) {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindUserQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  user,
}: CellSuccessProps<FindUserQuery, FindUserQueryVariables>) => {
  const [deleteUser] = useMutation(DELETE_MUTATION, {
    onCompleted: () => {
      toast.success('User deleted')
      navigate(routes.adminUsers())
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onDeleteClick = () => {
    if (confirm(`Are you sure you want to delete user ${user.id}?`)) {
      deleteUser({ variables: { id: user.id } })
    }
  }

  return (
    <div>
      <table className="table">
        <tbody>
          <tr>
            <td>ID</td>
            <td>{user.id}</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>{user.name}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>{user.email}</td>
          </tr>
          <tr>
            <td>Roles</td>
            <td>{user.roles}</td>
          </tr>
          <tr>
            <td>Trust Status</td>
            <td>{user.trustStatus}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex flex-row justify-center gap-2">
        <Link to={routes.editUser({ id: user.id })}>Edit</Link>
        <button
          type="button"
          onClick={onDeleteClick}
          className="btn btn-secondary"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
