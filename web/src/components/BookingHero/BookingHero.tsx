import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { useState } from 'react'

import { useAuth } from 'src/auth'
import BookingDatePickerCell from 'src/components/BookingDatePickerCell'
import PublicBookingsCell from 'src/components/PublicBookingsCell'

const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBookingMutation($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      bookingCode
    }
  }
`

const BookingHero = () => {
  const { hasRole } = useAuth()
  return (
    <div
      className="hero min-h-screen bg-base-200"
      style={{
        backgroundImage:
          'url(https://www.hakubavalley.com/cms/wp-content/themes/hv_themes/common/img/top-bg-about.jpg)',
      }}
    >
      <div className="z-1 hero-content z-10 flex-col">
        <div className="lg:-left text-center text-neutral-content">
          <h1 className="text-5xl font-bold">Register for a stay!</h1>
          <p className="py-6">
            Our lovely Hakuba home boasts an espresso machine all for you.
          </p>
        </div>
        <div className="min-h-10 card w-full max-w-sm flex-shrink-0 bg-base-100 shadow-2xl">
          {hasRole('admin') ? <AdminBookingForm /> : <MemberBookingForm />}
        </div>
      </div>
    </div>
  )
}

const AdminBookingForm = () => {
  const [createBooking, { loading, error }] = useMutation(
    CREATE_BOOKING_MUTATION,
    {
      onCompleted: (data) => {
        navigate(
          routes.userBooking({ bookingCode: data.createBooking.bookingCode })
        )
      },
    }
  )

  const onBook = () => {
    createBooking({
      variables: {
        input: {
          startDate,
          endDate,
          numGuests,
        },
      },
    })
  }

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [isValidDates, setIsValidDates] = useState(false)
  const [numGuests, setNumGuests] = useState(1)

  const onChange = (newStart, newEnd, isValid) => {
    setStartDate(newStart)
    setEndDate(newEnd)
    setIsValidDates(isValid)
  }

  return (
    <div className="card-body">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Trip Dates</span>
        </label>
        <div className="flex justify-center">
          <div className="indicator">
            <BookingDatePickerCell
              className="place-items-center"
              startDate={startDate}
              endDate={endDate}
              onChange={onChange}
            />
            <span
              className={`indicator-bottom badge indicator-item ${
                isValidDates ? 'badge-primary' : 'badge-accent'
              }`}
            >
              {isValidDates ? 'Valid' : 'Invalid'}
            </span>
          </div>
        </div>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Guests</span>
        </label>
        <input
          type="range"
          min={1}
          max="4"
          value={numGuests}
          onChange={(e) => setNumGuests(e.target.valueAsNumber)}
          className="range"
          step="1"
        />
        <div className="flex w-full justify-between px-2 text-xs">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
      </div>
      <div className="form-control mt-6">
        <button
          disabled={!isValidDates || loading}
          onClick={onBook}
          className="btn btn-primary"
        >
          Book
        </button>
      </div>
    </div>
  )
}

const MemberBookingForm = () => {
  const [createBooking, { loading, error }] = useMutation(
    CREATE_BOOKING_MUTATION,
    {
      onCompleted: (data) => {
        navigate(
          routes.userBooking({ bookingCode: data.createBooking.bookingCode })
        )
      },
    }
  )

  const onBook = () => {
    createBooking({
      variables: {
        input: {
          startDate,
          endDate,
          numGuests,
        },
      },
    })
  }

  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [isValidDates, setIsValidDates] = useState(false)
  const [numGuests, setNumGuests] = useState(1)

  const onChange = (newStart, newEnd, isValid) => {
    setStartDate(newStart)
    setEndDate(newEnd)
    setIsValidDates(isValid)
  }

  return (
    <div className="card-body">
      <PublicBookingsCell />
    </div>
  )
}

export default BookingHero
