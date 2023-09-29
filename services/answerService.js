const asyncHandler = require("express-async-handler");
const Key = require("../models/keyModel");
const User = require("../models/userModel");
const Questions = require("../models/questionModel");
const Answer = require("../models/answerModel");
// const fs=require('fs');
// const PDF = require('pdfkit');

//@desc Save rater answers to user
//@route POST /api/v1/answer/saveRateranswers
//@access private
exports.saveRaterAnswers = asyncHandler(async (req, res) => {
  const { answers, raterEmail, docId } = req.body;

  try {
    // 1. Find the rater document with the given docId and matching raterEmail
    const rater = await Answer.findOne({
      _id: docId,
      "raters.email": raterEmail,
    });
    
    // 2. Check if the rater document exists
    if (!rater) {
      return res
        .status(401)
        .json({ status: "fail", msg: "Incorrect email or id" });
    }

    // 3. Check if the user has already submitted their answers
    const matchingRater = rater.raters.find((r) => r.email === raterEmail);
    if (matchingRater && matchingRater.answers.length !== 0) {
      return res
        .status(401)
        .json({
          status: "fail",
          msg: "You have submitted your answers before",
        });
    }
    // 4. Initialize the answers array for the matching rater if it's not defined
    if (matchingRater && !matchingRater.answers) {
      matchingRater.answers = [];
    }

    // 4. Update the answers for the matching rater
    if (matchingRater) {
      matchingRater.answers = answers;
    }

    // 5. Save the updated rater document
    await rater.save();

    return res
      .status(200)
      .json({
        status: "success",
        msg: "You have submitted your answers successfully",
      });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", msg: "Internal server error" });
  }
});
//@desc Save answers to user
//@route POST /api/v1/answer/saveanswers
//@access private
exports.saveAnswers = asyncHandler(async (req, res) => {
  //validation : check if the id of doc contain rater email
  const { answers, raterEmails,raterNames } = req.body;
  const userId = req.user._id;
  //validation on raters' emails
  const user = await User.findOne({ _id: userId });
  if (user.quizTaken) {
    return res.status(200).json({ status: "you cannot take test again" });
  }
  user.quizTaken = 1;
  user.save();
  //TODO add emails of raters
  let raters = raterEmails.map((email, index) => ({
    email: email.toLowerCase(),
    name: raterNames[index], // Assuming raterNames has the corresponding names
  }));
 
  const answer = new Answer({
    userId,
    userAnswer: answers,
    raters,
  });
  await answer.save();
  // const answerId=answer._id;
  //TODO
  // send to raters email with this answerId
  return res
    .status(200)
    .json({ status: "you have submitted your answers successfully" });
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
  for (const section of sections) {
    // Find all answers for the user in the section
    const answers = await Answer.find({
      userId,
      section: section.id,
    });
    // Check if there are answers
    if (answers.length === 0) {
      return res.status(404).json({ status: `user didn't take the quiz` });
    }
    let totalAnswerEvaluation = 0;
    let totalUserAnswers = 0;
    // Calculate the total answerEvaluation
    for (const answer of answers) {
      for (const userAnswer of answer.userAnswer) {
        totalAnswerEvaluation += userAnswer.answer;
        totalUserAnswers++;
      }
    }

    // Calculate the average answer evaluation
    const averageAnswerEvaluation = totalAnswerEvaluation / totalUserAnswers;

    // Add the average answerEvaluation to the result
    result.push({
      sectionId: section.id,
      sectionname: section.name,
      averageAnswerEvaluation,
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
    const answers = await Answer.findOne({
      userId,
      questionId: {
        section: section.id,
      },
    });
    // Check if there are answers
    if (!answers) {
      return res.status(404).json({ status: `user didn't take the quiz` });
    }
    // Calculate the total answerEvaluation
    answers.raters.forEach((rater) => {
      const totalAnswerevaluation = rater.answers.reduce((acc, raterAnser) => {
        acc += raterAnser.answer;
        return acc;
      }, 0);

      // Calculate the average answerevaluation
      const averageAnswerevaluation =
        totalAnswerevaluation / rater.answers.length;

      // Add the average answerevaluation to the result
      result.push({
        sectionId: section.id,
        sectionname: section.name,
        averageAnswerevaluation,
      });
    });
  }

  // Return the result
  res.json(result);
});

//@desc generatepdf
//@route GET /api/v1/answer/generatepdf
//@access private
exports.generatePDF = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Create a new PDF document
  const answers = await Answer.find({ userId: userId });
  // const firstAnswers =
  const questions = await Questions.find();

  // const secondAnswers = answers.userAnswer.slice(3, 6);
  firstAnswers = answers[0];
  secondAnswers = answers[1];

  const pdfdocument = new PDF();
  // Add the header for the "User Answers" section
  //Iterate on the first user answers
  pdfdocument.text("First User Answers");
  for (const questionAnswer of firstAnswers.userAnswer) {
    const specificQuestion = questions.find((question) =>
      question._id.equals(questionAnswer.questionId)
    );
    pdfdocument.text(
      `Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`
    );
  }
  pdfdocument.text(`-----------------`);
  // Add the header for the "Rater Answers" section
  pdfdocument.text("First Rater Answers");
  // Save the PDF documents to files
  const resultsFilename = `results-${userId}.pdf`;
  pdfdocument.pipe(fs.createWriteStream(resultsFilename));
  //Iterate on the raters first test
  for (const rater of firstAnswers.raters) {
    for (const questionAnswer of rater.answers) {
      const specificQuestion = questions.find((question) =>
        question._id.equals(questionAnswer.questionId)
      );
      pdfdocument.text(
        `Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`
      );
    }
    pdfdocument.text(`-----------------`);
  }
  pdfdocument.addPage();
  //Iterate on the second user answers
  pdfdocument.text("Second User Answers");
  for (const questionAnswer of secondAnswers.userAnswer) {
    const specificQuestion = questions.find((question) =>
      question._id.equals(questionAnswer.questionId)
    );
    pdfdocument.text(
      `Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`
    );
  }
  pdfdocument.text(`-----------------`);
  pdfdocument.text("Second Rater Answers");
  for (const rater of secondAnswers.raters) {
    for (const questionAnswer of rater.answers) {
      const specificQuestion = questions.find((question) =>
        question._id.equals(questionAnswer.questionId)
      );
      pdfdocument.text(
        `Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`
      );
    }
    pdfdocument.text(`-----------------`);
  }

  pdfdocument.end();
  setTimeout(() => {
    res.download(resultsFilename);
  }, 100);
});
//--------------------------------------------------------------------------------------//
exports.getUserAnswersReport = asyncHandler(async (req, res) => {
  try {
    const { keyId,userId } = req.params;
    // Find all questions for the given key
    const questions = await Questions.find({ section: keyId });

    // Find the user's answers for the given key
    const userAnswers = await Answer.find({
      userId: userId,
      "userAnswer.questionId": { $in: questions.map((q) => q._id) },
    }).populate("userId");

    // Find the raters' answers for the given key
    const raterAnswers = await Answer.find({
      userId: userId,
      "raters.answers.questionId": { $in: questions.map((q) => q._id) },
    });
    // return res.json({"assx":userAnswers,"ratersssss":raterAnswers})
    // Create a map to store the average raters' answers for each question
    const averageRaterAnswers = {};

    // Initialize the averageRaterAnswers map
    questions.forEach((question) => {
      averageRaterAnswers[question._id] = {
        before: 0,
        after: 0,
      };
    });

    // Calculate the average answers of raters for each question

    raterAnswers[0].raters.forEach((rater) => {
      rater.answers.forEach((ans) => {
        const questionId = ans.questionId.toString();

        // Ensure there's an entry for this questionId
        if (!averageRaterAnswers[questionId]) {
          averageRaterAnswers[questionId] = {
            before: 0,
            after: 0,
          };
        }

        averageRaterAnswers[questionId].before += ans.answer;
      });
    });

    // Calculate the average by dividing by the number of raters (assuming 3 raters)
    questions.forEach((question) => {
      averageRaterAnswers[question._id].before /= 3;
    });
    // Calculate the user's second answers and update the averageRaterAnswers
    raterAnswers[1].raters.forEach((rater) => {
      rater.answers.forEach((ans) => {
        const questionId = ans.questionId.toString();

        // Ensure there's an entry for this questionId
        if (!averageRaterAnswers[questionId]) {
          averageRaterAnswers[questionId] = {
            before: 0,
            after: 0,
          };
        }

        averageRaterAnswers[questionId].after += ans.answer;
      });
    });

    // Calculate the average for the user's second answers
    questions.forEach((question) => {
      averageRaterAnswers[question._id].after /= 3; // Assuming each user takes the quiz twice
    });

    // Return the result
    const result = questions.map((question) => {
      const questionId = question._id.toString();
      const userAnswerBefore = userAnswers[0]?.userAnswer.find((ans) =>
        ans.questionId.equals(question._id)
      );
      const userAnswerAfter = userAnswers[1]?.userAnswer.find((ans) =>
        ans.questionId.equals(question._id)
      );

      return {
        question: question.text,
        before: {
          user: userAnswerBefore ? userAnswerBefore.answer : null,
          raters: averageRaterAnswers[questionId].before,
        },
        after: {
          user: userAnswerAfter ? userAnswerAfter.answer : null,
          raters: averageRaterAnswers[questionId].after,
        }
      };
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({status:`faild`,msg:`user should take the quiz twice and all raters should submit their answers in both times`})
    
  }
});
//--------------------------------------------------------------------------------------//
//first second ?  ?  ?  ?
exports.getUserAnswers = asyncHandler(async (req, res) => {
  try {
    const { userId,status } = req.params; // Assuming userId is passed as a parameter
    const user = await User.findById(userId); // Retrieve the user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's answers and populate the associated questions
    const userAnswers = await Answer.find({ userId })
      .populate("userAnswer.questionId")
      .exec();
      //check if user took the exam 
    if(!userAnswers[status]){
      return res.status(400).json({status:`faild`,'msg':`user didn't take the quiz`});
    }
    // Create a response object to store the formatted answers
    const response = {};
    const response2=[];

    // Loop through the user's answers
    userAnswers[status].userAnswer.forEach((userAnswer) => {
      const question = userAnswer.questionId;
      
      if (!question) {
        return; // Skip this answer and continue with the next one
      }
      const questionText = question.text;
      const userAnswerValue = userAnswer.answer;

      // Create an object for the current question
      if (!response[question._id]) {
        response[question._id] = {
          question: questionText,
          userAnswer: userAnswerValue,
          raters: [],
        };
      }
    });
    // return res.json(userAnswers[status])
    // return res.json(response)
    // Loop through the raters' answers for the current question
    userAnswers[status].raters.forEach((rater) => {
      const raterEmail = rater.email;
      const raterName = rater.name;
      console.log(rater.name)

      rater.answers.forEach((raterAnswer) => {
        const questionId = raterAnswer.questionId.toString();

        // Check if the question ID exists in response
        if (response[questionId]) {
          const raterAnswerValue = raterAnswer.answer;

          // Add the rater's answer to the current question's object
          response[questionId].raters.push({
            email: raterEmail,
            name:raterName,
            answer: raterAnswerValue,
          });
          response2.push(response[questionId]);
        }
      });
    });

    // Return the formatted response
    res.json(response2);
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
});
//--------------------------------------------------------------------------------------------------------------//
// exports.getUserAnswersReportTotal = asyncHandler(async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     // Find all keys
//     const keys = await Key.find();

//     // Initialize an array to store the results for all keys and questions
//     const results = [];

//     // Iterate over each key
//     for (const key of keys) {
//       // Find all questions for the current key
//       const questions = await Questions.find({ section: key._id });

//       // Find the user's answers for the current key
//       const userAnswers = await Answer.find({
//         userId: userId,
//         "userAnswer.questionId": { $in: questions.map((q) => q._id) },
//       });

//       // Find the raters' answers for the current key
//       const raterAnswers = await Answer.find({
//         userId: userId,
//         "raters.answers.questionId": { $in: questions.map((q) => q._id) },
//       });

//       // Create a map to store the average raters' answers for each question
//       const averageRaterAnswers = {};

//       // Initialize the averageRaterAnswers map
//       questions.forEach((question) => {
//         averageRaterAnswers[question._id] = {
//           before: 0,
//           after: 0,
//         };
//       });

//       // Calculate the average answers of raters for each question
//       raterAnswers[0].raters.forEach((rater) => {
//         rater.answers.forEach((ans) => {
//           const questionId = ans.questionId.toString();

//           // Ensure there's an entry for this questionId
//           if (!averageRaterAnswers[questionId]) {
//             averageRaterAnswers[questionId] = {
//               before: 0,
//               after: 0,
//             };
//           }

//           averageRaterAnswers[questionId].before += ans.answer;
//         });
//       });

//       // Calculate the average by dividing by the number of raters (assuming 3 raters)
//       questions.forEach((question) => {
//         averageRaterAnswers[question._id].before /= 3;
//       });

//       // Calculate the user's second answers and update the averageRaterAnswers
//       raterAnswers[1].raters.forEach((rater) => {
//         rater.answers.forEach((ans) => {
//           const questionId = ans.questionId.toString();

//           // Ensure there's an entry for this questionId
//           if (!averageRaterAnswers[questionId]) {
//             averageRaterAnswers[questionId] = {
//               before: 0,
//               after: 0,
//             };
//           }

//           averageRaterAnswers[questionId].after += ans.answer;
//         });
//       });

//       // Calculate the average for the user's second answers
//       questions.forEach((question) => {
//         averageRaterAnswers[question._id].after /= 3; // Assuming each user takes the quiz twice
//       });

//       // Create a result object for the current key
//       const keyResult = questions.map((question) => {
//         const questionId = question._id.toString();
//         const userAnswerBefore = userAnswers[0]?.userAnswer.find((ans) =>
//           ans.questionId.equals(question._id)
//         );
//         const userAnswerAfter = userAnswers[1]?.userAnswer.find((ans) =>
//           ans.questionId.equals(question._id)
//         );

//         return {
//           question: question.text,
//           before: {
//             user: userAnswerBefore ? userAnswerBefore.answer : null,
//             raters: averageRaterAnswers[questionId].before,
//           },
//           after: {
//             user: userAnswerAfter ? userAnswerAfter.answer : null,
//             raters: averageRaterAnswers[questionId].after,
//           }
//         };
//       });

//       // Push the key result to the results array
//       results.push({
//         key: key.name, // You can use any key identifier here
//         questions: keyResult,
//       });
//     }

//     return res.status(200).json(results);
//   } catch (error) {
//     return res.status(400).json({
//       status: "failed",
//       msg: "User should take the quiz twice, and all raters should submit their answers in both times"
//     });
//   }
// });
exports.getUserAnswersReportTotal = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all keys
    const keys = await Key.find();

    // Initialize an array to store the results for all keys and questions
    const results = [];

    // Iterate over each key
    for (const key of keys) {
      // Find all questions for the current key
      const questions = await Questions.find({ section: key._id });

      // Find the user's answers for the current key
      const userAnswers = await Answer.find({
        userId: userId,
        "userAnswer.questionId": { $in: questions.map((q) => q._id) },
      });

      // Find the raters' answers for the current key
      const raterAnswers = await Answer.find({
        userId: userId,
        "raters.answers.questionId": { $in: questions.map((q) => q._id) },
      });

      // Create a map to store the average raters' answers for each question
      const averageRaterAnswers = {};

      // Initialize the averageRaterAnswers map
      questions.forEach((question) => {
        averageRaterAnswers[question._id] = {
          before: 0,
          after: 0,
        };
      });

      // Calculate the average answers of raters for each question
      raterAnswers[0].raters.forEach((rater) => {
        rater.answers.forEach((ans) => {
          const questionId = ans.questionId.toString();

          // Ensure there's an entry for this questionId
          if (!averageRaterAnswers[questionId]) {
            averageRaterAnswers[questionId] = {
              before: 0,
              after: 0,
            };
          }

          averageRaterAnswers[questionId].before += ans.answer;
        });
      });

      // Calculate the average by dividing by the number of raters (assuming 3 raters)
      questions.forEach((question) => {
        averageRaterAnswers[question._id].before /= 3;
      });

      // Calculate the user's second answers and update the averageRaterAnswers
      raterAnswers[1].raters.forEach((rater) => {
        rater.answers.forEach((ans) => {
          const questionId = ans.questionId.toString();

          // Ensure there's an entry for this questionId
          if (!averageRaterAnswers[questionId]) {
            averageRaterAnswers[questionId] = {
              before: 0,
              after: 0,
            };
          }

          averageRaterAnswers[questionId].after += ans.answer;
        });
      });

      // Calculate the average for the user's second answers
      questions.forEach((question) => {
        averageRaterAnswers[question._id].after /= 3; // Assuming each user takes the quiz twice
      });

      // Calculate the differences for each question and the total difference for the key
      const keyResult = questions.map((question) => {
        const questionId = question._id.toString();
        const userAnswerBefore = userAnswers[0]?.userAnswer.find((ans) =>
          ans.questionId.equals(question._id)
        );
        const userAnswerAfter = userAnswers[1]?.userAnswer.find((ans) =>
          ans.questionId.equals(question._id)
        );

        // Calculate differences
        const userDiff = userAnswerAfter ? userAnswerAfter.answer - userAnswerBefore.answer : null;
        const ratersDiff = averageRaterAnswers[questionId].after - averageRaterAnswers[questionId].before;

        return {
          question: question.text,
          before: {
            user: userAnswerBefore ? userAnswerBefore.answer : null,
            raters: averageRaterAnswers[questionId].before,
          },
          after: {
            user: userAnswerAfter ? userAnswerAfter.answer : null,
            raters: averageRaterAnswers[questionId].after,
          },
          avg: {
            user: userDiff,
            raters: ratersDiff,
          }
        };
      });

      // Calculate the total differences for user and raters across all questions
      const totalUserDiff = keyResult.reduce((total, question) => {
        if (question.avg.user !== null) {
          total.user += question.avg.user;
        }
        if (question.avg.raters !== null) {
          total.raters += question.avg.raters;
        }
        return total;
      }, { user: 0, raters: 0 });

      results.push({
        key: key.name, // You can use any key identifier here
        questions: keyResult,
        totalDifference: totalUserDiff,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      msg: "User should take the quiz twice, and all raters should submit their answers in both times"
    });
  }
});
