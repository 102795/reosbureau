export interface Enrollment {
  studentNumber: string;
  reisId: string;
  identityCardNumber: string;
  remarks: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  maxEnrollments: number;
  enrollments: Enrollment[];
  imageUrl: string;
}

export type Page = "home" | "admin" | "student";
