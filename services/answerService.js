const asyncHandler = require("express-async-handler");
const Key = require("../models/keyModel");
const Answer = require("../models/answerModel");

//@desc Save answers to user
//@route POST /api/v1/User/:id/saveanswers
//@access private
exports.saveAnswers = asyncHandler(async (req, res) => {
  const { answers,isRater} = req.body;
  //validation on raters' emails
  if (isRater) {
    // The user is a rater
    const answer = new Answer({
      raters: {
        email: req.body.email,
        answers: answers,
      },
    });
    await answer.save();
  } else {
    // The user is a user
    const userId = req.user._id;
    const answer = new Answer({
      userId,
      userAnswer: answers,
    });
    await answer.save();
  }

  // Save the answer to the database

  if (answers) {
    res.status(200).json({ status: "successfully saved answers" });
  }
});
//@desc Count The average answers for a user in each section
//@route GET /api/v1/User/:id/countanswers
//@access private
exports.countAnswersAverage = asyncHandler(async (req, res) => {
  const result = [];

  const userId = req.user._id;
  // Get all sections
  const sections = await Key.find();
  // Loop on each section
  for (const section of sections) {
    // Find all answers for the user in the section
    const answers = await Answer.findOne(
      {
        userId,
        questionId: {
          section: section.id,
        },
      }
    );
    // Check if there are answers
    if(!answers){
      return res.status(404).json({status:`user didn't take the quiz`})
    }
    // Calculate the total answerEvaluation
      const totalAnswerevaluation = answers.reduce((acc, answer) => {
        acc += answer.userAnswer.reduce(
          (acc, answer) => acc + answer.answer,
          0
        );
        return acc;
      }, 0);

      // Calculate the average answerevaluation
      const averageAnswerevaluation =
        totalAnswerevaluation / answers.userAnswer.length;

      // Add the average answerevaluation to the result
      result.push({
        sectionId: section.id,
        averageAnswerevaluation,
      });
   
  }

  // Return the result
  res.json(result);
});


exports.countRatersAnswersAverage = asyncHandler(async (req, res) => {
  const result = [];

  const userId = req.user._id;
  // Get all sections
  const sections = await Key.find();
  // Loop on each section
  for (const section of sections) {
    // Find all answers for the user in the section
    const answers = await Answer.findOne(
      {
        userId,
        questionId: {
          section: section.id,
        },
      }
    );
    // Check if there are answers
    if(!answers){
      return res.status(404).json({status:`user didn't take the quiz`})
    }
    // Calculate the total answerEvaluation
    answers.raters.forEach(rater => {
        
        const totalAnswerevaluation = rater.answers.reduce((acc, raterAnser) => {
          acc +=raterAnser.answer
          return acc;
          }, 0);
          
          // Calculate the average answerevaluation
          const averageAnswerevaluation =
          totalAnswerevaluation / rater.answers.length;
          
          // Add the average answerevaluation to the result
          result.push({
            sectionId: section.id,
            averageAnswerevaluation,
          });
        });
   
  }

  // Return the result
  res.json(result);
});