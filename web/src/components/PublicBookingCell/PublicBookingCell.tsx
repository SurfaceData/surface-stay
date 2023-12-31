import type {
  FindPublicBookingQuery,
  FindPublicBookingQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Link, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { FaCat, FaDog } from 'react-icons/fa'

import { useAuth } from 'src/auth'

export const QUERY = gql`
  query FindPublicBookingQuery($bookingCode: String!) {
    publicBooking: publicBooking(bookingCode: $bookingCode) {
      id
      startDate
      endDate
      maxGuests
      numGuests
      withCat
      withDog
      bookingCode
      status
      item {
        id
        image
        text
      }
      member {
        status
        user {
          name
        }
      }
    }
  }
`
const MUTATION = gql`
  mutation JoinBooking($bookingCode: String!) {
    joinBooking(bookingCode: $bookingCode) {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindPublicBookingQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  bookingCode,
  publicBooking,
}: CellSuccessProps<
  FindPublicBookingQuery,
  FindPublicBookingQueryVariables
>) => {
  const { isAuthenticated } = useAuth()

  const spotsAvailable = publicBooking.numGuests < publicBooking.maxGuests
  return (
    <div className="min-h-screen w-full bg-base-200">
      <div className="hero-content flex-col items-start lg:flex-row">
        <figure className="h-96 w-96">
          {publicBooking?.item ? (
            <img src={publicBooking.item.image} />
          ) : (
            <div className="placeholder h-96 w-96 bg-neutral-content" />
          )}
        </figure>
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold">
            Booking Code: {publicBooking.bookingCode}
          </h2>
          <div className="flex justify-between gap-2">
            <div>Status</div>
            <div className="badge badge-accent badge-lg">
              {publicBooking.status}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>Start Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(publicBooking.startDate).toLocaleDateString('en-CA')}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div>End Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(publicBooking.endDate).toLocaleDateString('en-CA')}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div>Number of Guests</div>
            <div className="badge badge-accent badge-lg">
              {publicBooking.numGuests}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div>Animals</div>
            <div className="flex flex-row gap-2">
              {publicBooking.withCat && <FaCat />}
              {publicBooking.withDog && <FaDog />}
            </div>
          </div>

          <div className="flex justify-between gap-2"></div>
          {isAuthenticated ? (
            <MemberTable
              bookingCode={bookingCode}
              publicBooking={publicBooking}
            />
          ) : (
            <Link to={routes.login()}>
              <button className="btn btn-primary">Login to join</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

const MemberTable = ({ bookingCode, publicBooking }) => {
  const [joinBooking, { loading, error }] = useMutation(MUTATION, {
    refetchQueries: [{ query: QUERY, variables: { bookingCode } }],
  })

  const onJoin = () => {
    joinBooking({
      variables: { bookingCode },
    })
  }
  const spotsAvailable = publicBooking.numGuests < publicBooking.maxGuests
  return (
    <>
      {spotsAvailable ? (
        <button disabled={loading} onClick={onJoin} className="btn btn-primary">
          {loading && <span className="loading loading-spinner" />}
          Join
        </button>
      ) : (
        <button disabled className="btn btn-warning">
          Full
        </button>
      )}

      <div className="overflow-x-auto">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {publicBooking.member.map((mb, index) => (
              <tr key={`mb-${index}`}>
                <th>{index + 1}</th>
                <td>{mb.user.name}</td>
                <td>{mb.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
