const asyncHandler = require("express-async-handler");
const Key = require("../models/keyModel");
const User= require("../models/userModel");
const Answer = require("../models/answerModel");


//@desc Save answers to user
//@route POST /api/v1/answer/saveanswers
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
    const user = await User.findOne({_id:userId});
    if(user.quizTaken){
      return res.status(200).json({ status: "you cannot take test again" });
    }
    user.quizTaken=1;
    user.save();

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
//@route GET /api/v1/answer/countanswers
//@access private
exports.countAnswersAverage = asyncHandler(async (req, res) => {
  const result = [];

  const userId = req.user._id;
  // Get all sections
  const sections = await Key.find();
  // Loop on each section
  // eslint-disable-next-line no-restricted-syntax
  for (const section of sections) {
    // Find all answers for the user in the section
    // eslint-disable-next-line no-await-in-loop
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
          // eslint-disable-next-line no-shadow
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


//@desc Count The average answers for a rater in each section
//@route GET /api/v1/answer/countanswersraters
//@access private
exports.countRatersAnswersAverage = asyncHandler(async (req, res) => {
  const result = [];

  const userId = req.user._id;
  // Get all sections
  const sections = await Key.find();
  // Loop on each section
  // eslint-disable-next-line no-restricted-syntax
  for (const section of sections) {
    // Find all answers for the user in the section
    // eslint-disable-next-line no-await-in-loop
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











//@desc generatepdf
//@route POST /api/v1/answer/saveanswers
//@access private
// exports.generatePDF = asyncHandler(async (req, res) => {
//   const userId = req.user._id;
//   const { isRater } = req.body;

//   // Get the answers from the database
//   const answers = await Answer.find({
//     userId: userId,
//     isRater: isRater,
//   });

//   // Create a new PDF document
//   const pdf = new PDF();

//   // Add the answers to the PDF document
//   for (const answer of answers) {
//     pdf.text(`User ID: ${answer.userId}`);
//     pdf.text(`Is Rater: ${answer.isRater}`);
//     for (const questionAnswer of answer.userAnswer) {
//       pdf.text(`Question ID: ${questionAnswer.questionId}`);
//       pdf.text(`Answer: ${questionAnswer.answer}`);
//     }
//   }

//   // Save the PDF document to a file
//   const filename = `answers-${userId}-${isRater}.pdf`;
//   await pdf.save(filename);

//   // Redirect the user to the PDF file
//   res.redirect(`/pdfs/${filename}`);
// });