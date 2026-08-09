import type { ReservationDto, ReservationVisualStatus } from "@/types";

/** Derives the UI status. Later the API may return this value directly. */
export function reservationVisualStatus(
  reservation: ReservationDto,
  now: Date = new Date(),
): ReservationVisualStatus {
  if (reservation.status === "CANCELLED") return "CANCELLED";
  const start = new Date(reservation.startsAt);
  const end = new Date(reservation.endsAt);
  if (now < start) return "UPCOMING";
  if (now >= end) return "FINISHED";
  return "IN_PROGRESS";
}
