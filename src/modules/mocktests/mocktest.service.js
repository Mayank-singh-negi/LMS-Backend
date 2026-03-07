import MockTest from "./mocktest.model.js";

export const generateMockTest = async (courseId, title) => {
  // temporary fake AI generator
  const questions = [
    {
      question: "What is Node.js?",
      options: [
        "Frontend framework",
        "Runtime environment",
        "Database",
        "Operating system"
      ],
      correctAnswer: "Runtime environment",
    },
    {
      question: "Which DB are we using?",
      options: [
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "Oracle"
      ],
      correctAnswer: "MongoDB",
    },
  ];

  const mockTest = await MockTest.create({
    course: courseId,
    title,
    questions,
  });

  return mockTest;
};
