const asyncHandler = require("express-async-handler");
const Key = require("../models/keyModel");
const Answer = require("../models/answerModel");

//@desc Save answers to user
//@route POST /api/v1/User/:id/saveanswers
//@access private
exports.saveAnswers = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { answers } = req.body;

  // Create a new Answer model instance
  const answer = new Answer({
    userId,
    userAnswer: answers,
  });

  // Save the answer to the database
  await answer.save();
  if (answers) {
    res.status(200).json({ status: "successfully saved answers" });
  }
});
//@desc Count The average answers for a user in each section
//@route GET /api/v1/User/:id/countanswers
//@access private
exports.countAnswersAverage = asyncHandler(async (req, res) => {
  const result = [];

  const userId = req.params.id;
  // Get all sections
  const sections = await Key.find();
  // Loop on each section
  for (const section of sections) {
    // Find all answers for the user in the section
    const answers = await Answer.find(
      {
        userId,
        questionId: {
          section: section.id,
        },
      },
      {
        raters: false,
      }
    );
    console.log(answers);
    // Check if there are answers
    if (answers.length > 0) {
      // Calculate the total answerevaluation
      const totalAnswerevaluation = answers.reduce((acc, answer) => {
        acc += answer.userAnswer.reduce(
          (acc, answer) => acc + answer.answer,
          0
        );
        return acc;
      }, 0);

      // Calculate the average answerevaluation
      const averageAnswerevaluation =
        totalAnswerevaluation / answers[0].userAnswer.length;

      // Add the average answerevaluation to the result
      result.push({
        sectionId: section.id,
        averageAnswerevaluation,
      });
    } else {
      // There are no answers, so set the average answerevaluation to null
      result.push({
        sectionId: section.id,
        averageAnswerevaluation: null,
      });
    }
  }

  // Return the result
  res.json(result);
});
