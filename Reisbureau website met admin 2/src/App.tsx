import { useState } from "react";
import { Trip, Page, Enrollment } from "./types";
import { initialTrips } from "./data";
import Navigation from "./components/Navigation";
import HomePage from "./components/HomePage";
import AdminPage from "./components/AdminPage";
import StudentPage from "./components/StudentPage";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [trips, setTrips] = useState<Trip[]>(initialTrips);

  function addTrip(trip: Trip) {
    setTrips((prev) => [...prev, trip]);
  }

  function updateTrip(updated: Trip) {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function deleteTrip(id: string) {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  function enroll(reisId: string, enrollment: Enrollment) {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === reisId ? { ...t, enrollments: [...t.enrollments, enrollment] } : t
      )
    );
  }

  function unenroll(reisId: string, studentNumber: string) {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === reisId
          ? { ...t, enrollments: t.enrollments.filter((e) => e.studentNumber !== studentNumber) }
          : t
      )
    );
  }

  return (
    <div className="min-h-full">
      <Navigation currentPage={page} onNavigate={setPage} />
      {page === "home" && <HomePage trips={trips} onNavigate={setPage} />}
      {page === "admin" && (
        <AdminPage
          trips={trips}
          onAddTrip={addTrip}
          onUpdateTrip={updateTrip}
          onDeleteTrip={deleteTrip}
        />
      )}
      {page === "student" && (
        <StudentPage
          trips={trips}
          onEnroll={enroll}
          onUnenroll={unenroll}
        />
      )}
    </div>
  );
}
