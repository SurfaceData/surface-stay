import type {
  QueryResolvers,
  MutationResolvers,
  BookingRelationResolvers,
  MemberBookingRelationResolvers,
  AdminBookingRelationResolvers,
} from 'types/graphql'

import ShortUniqueId from 'short-unique-id'
import { validateWith } from '@redwoodjs/api'

import { db } from 'src/lib/db'
import { generateBookingItem, generateItem } from 'src/lib/gen'
import { mailer } from 'src/lib/mailer'
import { CreateBooking } from 'src/mail/CreateBooking/CreateBooking'
import { JoinApproved } from 'src/mail/JoinApproved/JoinApproved'
import { JoinBooking } from 'src/mail/JoinBooking/JoinBooking'

const bookingCodeGenerator = new ShortUniqueId({ length: 6 })

export const bookings: QueryResolvers['bookings'] = () => {
  return db.booking.findMany()
}

export const adminBookings: QueryResolvers['adminBookings'] = () => {
  return db.booking.findMany()
}

export const adminBooking: QueryResolvers['adminBookings'] = ({ id }) => {
  return db.booking.findUnique({ where: { id } })
}

export const userBookings: QueryResolvers['userBookings'] = () => {
  return db.booking.findMany({
    where: {
      userId: context.currentUser.id,
    },
    orderBy: {
      startDate: 'asc',
    },
  })
}

export const userBooking: QueryResolvers['userBooking'] = ({ bookingCode }) => {
  return db.booking.findUnique({
    where: { bookingCode, userId: context.currentUser.id },
  })
}

export const publicBookings: QueryResolvers['publicBookings'] = ({ limit }) => {
  return db.booking.findMany({
    where: {
      numGuests: { lt: db.booking.fields.maxGuests },
      startDate: { gt: new Date() },
      userId: { not: context.currentUser?.id },
    },
    orderBy: {
      startDate: 'asc',
    },
    take: limit,
  })
}

export const publicBooking: QueryResolvers['publicBooking'] = ({
  bookingCode,
}) => {
  return db.booking.findUnique({
    where: { bookingCode },
  })
}

export const futureBookings: QueryResolvers['futureBookings'] = () => {
  return db.booking.findMany({
    where: {
      startDate: { gt: new Date() },
    },
    orderBy: {
      startDate: 'asc',
    },
  })
}

export const memberBookings: QueryResolvers['memberBookings'] = () => {
  return db.memberBooking.findMany({
    where: {
      userId: context.currentUser.id,
    },
    orderBy: {
      booking: {
        startDate: 'asc',
      },
    },
  })
}

export const booking: QueryResolvers['booking'] = ({ id }) => {
  return db.booking.findUnique({
    where: { id },
  })
}

export const joinBooking: MutationResolvers['joinBooking'] = async ({
  bookingCode,
}) => {
  const booking = await db.booking.findUnique({
    where: {
      bookingCode,
    },
    select: {
      user: true,
      maxGuests: true,
      numGuests: true,
      member: true,
    },
  })

  await validateWith(async () => {
    if (!booking) {
      throw new Error('Invalid booking.')
    }
    if (booking.numGuests === booking.maxGuests) {
      throw new Error('Booking not available for joining')
    }
  })

  const updatedBooking = await db.booking.update({
    where: { bookingCode },
    data: {
      member: {
        create: [
          {
            status: 'pending',
            userId: context.currentUser.id,
          },
        ],
      },
    },
  })
  await mailer.send(
    JoinBooking({
      code: bookingCode,
      link: `https://www.kt-villa.com/booking/${bookingCode}`,
      name: context.currentUser.name,
    }),
    {
      to: booking.user.email,
      subject: 'Request to join your trip',
    }
  )
  return updatedBooking
}

export const createBooking: MutationResolvers['createBooking'] = async ({
  input,
}) => {
  await validateWith(async () => {
    if (input.numGuests < 0 || input.numGuests > 4) {
      throw new Error('Pick between 1 and 4 guests')
    }
    const candidateConflicts = await db.booking.findMany({
      where: {
        startDate: { gt: new Date() },
      },
      orderBy: {
        startDate: 'asc',
      },
    })
    if (candidateConflicts.length === 0) {
      return
    }
    if (input.endDate < candidateConflicts[0].startDate) {
      return
    }
    if (
      input.startDate >
      candidateConflicts[candidateConflicts.length - 1].endDate
    ) {
      return
    }
    for (let i = 0; i < candidateConflicts.length - 1; ++i) {
      const curr = candidateConflicts[i]
      const next = candidateConflicts[i + 1]
      if (curr.endDate < input.startDate && input.endDate < next.startDate) {
        return
      }
    }
    throw new Error('Invalid dates. Conflicts with existing booking')
  })
  const user = await db.user.findUnique({
    where: { id: context.currentUser.id },
  })
  const trustStatus = user.trustStatus
  const status = trustStatus === 'trusted' ? 'approved' : 'pending'
  const booking = await db.booking.create({
    data: {
      ...input,
      status,
      bookingCode: bookingCodeGenerator.rnd(),
      userId: context.currentUser.id,
    },
  })
  await mailer.send(
    CreateBooking({
      code: booking.bookingCode,
      link: 'https://www.kt-villa.com/admin/bookings',
    }),
    {
      to: process.env.ADMIN_EMAIL,
      subject: 'New Booking Created',
    }
  )

  if (status === 'pending') {
    return booking
  }
  return generateBookingItem(booking.id)
}

export const createBookingItemAdmin: MutationResolvers['createBookingItemAdmin'] =
  async ({ id }) => {
    await validateWith(async () => {
      const booking = await db.booking.findUnique({
        where: { id },
      })
      if (!booking || !booking.status === 'approved') {
        throw new Error('Booking is not approved yet')
      }
    })
    return generateBookingItem(id)
  }

export const addMemberBooking: MutationResolvers['addMemberBooking'] = async ({
  id,
  username,
}) => {
  const users = await db.user.findMany({
    where: { name: username },
    select: { id: true },
  })
  const booking = await db.booking.findUnique({
    where: { id },
  })
  await validateWith(async () => {
    if (!context.currentUser) {
      throw new Error('not authorized')
    }
    if (users.length !== 1) {
      throw new Error('No user found')
    }
    if (!booking) {
      throw new Error('No booking found')
    }
    if (booking.userId !== context.currentUser.id) {
      throw new Error('Not authorized')
    }
  })
  const userId = users[0].id
  const userItemId = await generateItem(userId, booking.startDate)
  return db.booking.update({
    where: { id },
    data: {
      member: {
        create: [
          {
            userId,
            userItemId,
            status: 'approved',
          },
        ],
      },
    },
  })
}

export const updateMemberBookingStatus: MutationResolvers['updateMemberBookingStatus'] =
  async ({ id, status }) => {
    const memberBooking = await db.memberBooking.findUnique({
      where: { id },
      select: {
        booking: true,
        user: true,
      },
    })
    await validateWith(async () => {
      if (!context.currentUser) {
        throw new Error('not authorized')
      }
      if (!memberBooking) {
        throw new Error('Invalid Member Booking')
      }
      if (!memberBooking.booking) {
        throw new Error('Invalid Booking')
      }
      if (memberBooking.booking.userId != context.currentUser.id) {
        throw new Error('Permission Denied')
      }
    })
    const { booking, user } = memberBooking

    const statusSetBooking = await db.memberBooking.update({
      data: {
        status,
      },
      where: { id },
    })
    if (statusSetBooking.status !== 'approved' || statusSetBooking.userItemId) {
      return statusSetBooking
    }
    const userItemId = await generateItem(user.id, booking.startDate)
    const updatedMemberBooking = await db.memberBooking.update({
      data: {
        userItem: {
          connect: { id: userItemId },
        },
        booking: {
          update: {
            numGuests: { increment: 1 },
          },
        },
      },
      where: { id },
    })
    await mailer.send(
      JoinApproved({
        code: booking.bookingCode,
        link: `https://www.kt-villa.com/public-booking/${booking.bookingCode}`,
        name: user.name,
      }),
      {
        to: user.email,
        subject: 'Your request to join is approved',
      }
    )

    return updatedMemberBooking
  }

export const updateBookingStatus: MutationResolvers['updateBookingStatus'] = ({
  id,
  status,
}) => {
  return db.booking.update({
    data: {
      status,
    },
    where: { id },
  })
}

export const updateBooking: MutationResolvers['updateBooking'] = ({
  id,
  input,
}) => {
  return db.booking.update({
    data: input,
    where: { id },
  })
}

export const deleteBooking: MutationResolvers['deleteBooking'] = ({ id }) => {
  return db.booking.delete({
    where: { id },
  })
}

export const MemberBooking: MemberBookingRelationResolvers = {
  user: (_obj, { root }) => {
    return db.memberBooking.findUnique({ where: { id: root?.id } }).user()
  },
  booking: (_obj, { root }) => {
    return db.memberBooking.findUnique({ where: { id: root?.id } }).booking()
  },
  item: (_obj, { root }) => {
    return db.memberBooking.findUnique({ where: { id: root?.id } }).userItem()
  },
}

export const Booking: BookingRelationResolvers = {
  item: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).userItem()
  },
  member: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).member()
  },
}

export const AdminBooking: AdminBookingRelationResolvers = {
  user: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).user()
  },
  item: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).userItem()
  },
}
