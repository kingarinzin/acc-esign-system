export type FieldType = "signature" | "name" | "date";

export type PreparedField = {
  id: string;
  type: FieldType;
  x: number;
  y: number;
  width?: number;  // optional if you later support resizing
  height?: number; // optional if you later support resizing
  page?: number;   // optional for multi-page later
};

export type Participant = {
  name: string;
  email: string;
  signed: boolean;
};

export type MeetingDoc = {
  _id?: string;
  title: string;
  date?: string;
  description: string;
  participants: Participant[];
  fileName: string;
  filePath: string;
  status: "Prepared" | "Draft" | string;
  organizerId: string;
  fields?: PreparedField[];
  createdAt: Date;
  updatedAt?: Date;
};
