const asyncHandler = require("express-async-handler");
const Key = require("../models/keyModel");
const User = require("../models/userModel");
const Questions = require("../models/questionModel");
const Answer = require("../models/answerModel");
const sendEmail = require("../utils/sendEmail");
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
      return res.status(401).json({
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

    return res.status(200).json({
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
  const { answers, raterEmails, raterNames } = req.body;
  const userId = req.user._id;
  //validation on raters' emails
  const user = await User.findOne({ _id: userId });
  if (user.quizStatus === "finished") {
    return res
      .status(400)
      .json({ status: "لا يمكنك اخذ الاختبار مره اخري حتي يأذن لك الادمن" });
  }

  const userEmail = user.email;
  //TODO add emails of raters
  let raters = raterEmails.map((email, index) => ({
    email: email.toLowerCase(),
    name: raterNames[index], // Assuming raterNames has the corresponding names
  }));

  // Check if the user already has an answer
  let existingAnswer = await Answer.findOne({ userId });
  let finalAnswers = null;
  let message = "";

  if (existingAnswer) {
    // If answer exists, append the new answers to the existing ones
    existingAnswer.userAnswer = existingAnswer.userAnswer.concat(answers);
    existingAnswer.raters = raters;
    await existingAnswer.save();
    finalAnswers = existingAnswer;
  } else {
    // If no answer exists, create a new answer document
    const answer = new Answer({
      userId,
      userAnswer: answers,
      raters,
    });
    await answer.save();
    finalAnswers = answer;
  }
  const status = await updateUserQuizStatus(
    finalAnswers.userAnswer.lengh,
    user
  );
  //TODO
  // send to raters email with this answerId
  if (status === "finished") {
    await SendEmailsToRaters(finalAnswers, userEmail);
    message = "تم انهاء الاختبار بنجاح وتم ارسال رساله الي المقيمين لتقييمك";
  } else {
    message = "تم تسجيل الاجابات الحاليه ,لا تنسي تكمله الاختبار";
  }

  return res.status(200).json({ status: "success", message });
});
//--------------------------------------------------------------------------------------//

exports.getUserAnswersReport = asyncHandler(async (req, res) => {
  try {
    const { keyId, userId } = req.params;
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
        },
      };
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      status: `faild`,
      msg: `user should take the quiz twice and all raters should submit their answers in both times`,
    });
  }
});
//--------------------------------------------------------------------------------------//
//first second ?  ?  ?  ?
exports.getUserAnswers = asyncHandler(async (req, res) => {
  try {
    const { userId, status } = req.params; // Assuming userId is passed as a parameter
    const user = await User.findById(userId); // Retrieve the user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's answers and populate the associated questions
    const userAnswers = await Answer.find({ userId })
      .populate("userAnswer.questionId")
      .exec();
    //check if user took the exam
    if (!userAnswers[status]) {
      return res
        .status(400)
        .json({ status: `faild`, msg: `user didn't take the quiz` });
    }
    // Create a response object to store the formatted answers
    const response = {};
    const response2 = [];

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
      console.log(rater.name);

      rater.answers.forEach((raterAnswer) => {
        const questionId = raterAnswer.questionId.toString();

        // Check if the question ID exists in response
        if (response[questionId]) {
          const raterAnswerValue = raterAnswer.answer;

          // Add the rater's answer to the current question's object
          response[questionId].raters.push({
            email: raterEmail,
            name: raterName,
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
        const userDiff = userAnswerAfter
          ? userAnswerAfter.answer - userAnswerBefore.answer
          : null;
        const ratersDiff =
          averageRaterAnswers[questionId].after -
          averageRaterAnswers[questionId].before;

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
          },
        };
      });

      // Calculate the total differences for user and raters across all questions
      const totalUserDiff = keyResult.reduce(
        (total, question) => {
          if (question.avg.user !== null) {
            total.user += question.avg.user;
          }
          if (question.avg.raters !== null) {
            total.raters += question.avg.raters;
          }
          return total;
        },
        { user: 0, raters: 0 }
      );

      // Calculate the graph section for this key
      const graph = {
        userBefore:
          keyResult.reduce((total, question) => {
            if (question.before.user !== null) {
              total += question.before.user;
            }
            return total;
          }, 0) / questions.length,
        userAfter:
          keyResult.reduce((total, question) => {
            if (question.after.user !== null) {
              total += question.after.user;
            }
            return total;
          }, 0) / questions.length,
        raterBefore:
          keyResult.reduce((total, question) => {
            total += question.before.raters;
            return total;
          }, 0) / questions.length,
        raterAfter:
          keyResult.reduce((total, question) => {
            total += question.after.raters;
            return total;
          }, 0) / questions.length,
      };

      results.push({
        key: key.name, // You can use any key identifier here
        desc: key.desc ? key.desc : null,
        questions: keyResult,
        graph: graph,
        totalDifference: totalUserDiff,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      msg: "User should take the quiz twice, and all raters should submit their answers in both times",
    });
  }
});

//--------------------------------------------------------------------------------------------------------------//
exports.updateRaterEmail = asyncHandler(async (req, res) => {
  const { raterId, newEmail } = req.body;

  try {
    // 1. Find the rater document with the given docId and matching raterEmail
    const answer = await Answer.findOne({
      "raters._id": raterId,
    });

    // 2. Check if the rater document exists
    if (!answer) {
      return res
        .status(401)
        .json({ status: "fail", msg: "Incorrect email or id" });
    }

    // 3. Find the rater within the answer document
    const rater = answer.raters.find((r) => r._id.toString() === raterId);

    // 4. Update the rater's email
    rater.email = newEmail;
    rater.gotEmailAt = null; // Reset gotEmailAt

    // 5. Save the updated answer document
    await answer.save();

    return res.status(200).json({
      status: "success",
      msg: "Rater email updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", msg: "Internal server error" });
  }
});
//--------------------------------------------------------------------------------------------------------------//
//@desc get list of QuestionIds that user answered
//@use  in QuestionService , to get questions that user didn't answer yet
exports.getAnsweredQuestions = asyncHandler(async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  let index = 0;
  const userAnswers = await Answer.find({ userId });
  // use cannot take second quiz unless he took the first one
  if (userAnswers.length > 1) {
    index = 1;
  }
  const answeredQuestions = userAnswers[index].userAnswer.map((answer) => {
    return answer.questionId;
  });
  return answeredQuestions;
});
//--------------------------------------------------------------------------------------------------------------//
const SendEmailsToRaters = async (answer, userEmail) => {
  const url = `${process.env.RATERS_URL}`;
  answer.raters.forEach(async (rater) => {
    const raterEmail = rater.email;

    try {
      let emailMessage = "";

      emailMessage = `Hi ${raterEmail} 
                        \n your friend ${userEmail} invited you to
                        \n to rate him in a quick Quiz
                        \n here is the link : ${url}
                        \n use this code when you register your answer : ${answer._id}`;

      await sendEmail({
        to: raterEmail,
        subject: `rate your frined ${userEmail}`,
        text: emailMessage,
      });

      rater.gotEmailAt = Date.now(); // Update gotEmailAt

      await rater.save(); // Save the updated rater
    } catch (err) {
      return next(new ApiError("there is a problem with sending Email", 500));
    }
  });

  return true;
};
//--------------------------------------------------------------------------------------------------------------//
//@desc update user quiz status
//@use  in answerService , to update user quiz status
const updateUserQuizStatus = async (answeredQuestions, user) => {
  //check the desired question = the answered question

  const questions = await Questions.find({
    section: { $in: user.allowed_keys },
  });
  if (answeredQuestions.length === questions) {
    //update user quiz status to finished
    user.quizStatus = "finished";
    await user.save();
    return "finished";
  } else {
    user.quizStatus = "inProgress";
    await user.save();
    return "inProgress";
  }
};
