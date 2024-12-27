const asyncHandler = require("express-async-handler");
const multer = require("multer");
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
    const answerDoc = await Answer.findOne({
      _id: docId,
      "raters.email": raterEmail,
    });

    // 2. Check if the rater document exists
    if (!answerDoc) {
      return res
        .status(401)
        .json({ status: "fail", msg: "Incorrect email or id" });
    }

    // 3. Check if the user has already submitted their answers
    const matchingRater = answerDoc.raters.find((r) => r.email === raterEmail);
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
    await answerDoc.save();

    // 6. update isRaterAnserCompleted
    await this.updateIsRaterAnsersCompleted(answerDoc);
    //7.  check if user is ready to get a report
    const isReportReady = await this.checkUserReport(answerDoc.userId);

    return res.status(200).json({
      status: "success",
      msg: "لقد تم تسجيل اجاباتك بنجاح",
      isReportReady: isReportReady,
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
  //---------------------B1----------------//

  const { answers, raterEmails, raterNames } = req.body;
  const userId = req.user._id;
  //validation on raters' emails
  const user = await User.findOne({ _id: userId });
  if (user.quizStatus === "finished") {
    return res
      .status(400)
      .json({ status: "لا يمكنك اخذ الاختبار مره اخري حتي يأذن لك الادمن" });
  }
  const filteredEmails = raterEmails.filter((email) => email !== null);
  //TODO add emails of raters
  let raters = filteredEmails?.map((email, index) => ({
    email: email.toLowerCase(),
    name: raterNames[index], // Assuming raterNames has the corresponding names
  }));
  //reset to it
  // //TODO add emails of raters
  // let raters = raterEmails?.map((email, index) => ({
  //   email: email.toLowerCase(),
  //   name: raterNames[index], // Assuming raterNames has the corresponding names
  // }));

  //-------------------B1 end-------------------//
  //-------------------B2-------------------//
  //userAnswers--> will be all answers for this user
  //@desc--> this block is to deteremine if i should work on the first answer or the second one
  // Get user Answers
  const userAnswers = await Answer.find({ userId });
  let answer;

  if (
    (user.quizStatus === "ready" || user.quizStatus === "inProgress") &&
    user.retakeQuizAt
  ) {
    answer = userAnswers[1];
  } else {
    answer = userAnswers[0];
  }
  //-------------------B2 end -------------------//

  //-------------------B3-------------------//
  //@desc --> if answer exists ? update it : create new one and save it
  if (answer) {
    // If answer exists, append the new answers to the existing ones
    answer.userAnswer = answer.userAnswer.concat(answers);
    answer.raters = raters;
    await answer.save();
  } else {
    // If no answer exists, create a new answer document
    answer = new Answer({
      userId,
      userAnswer: answers,
      raters,
    });
    await answer.save();
  }
  //-------------------B3 end-------------------//
  //-------------------B4-------------------//
  //@desc --> update user quiz status to check if he finished the quiz
  //income --> to check whether i should send emails to raters ot not
  let message = "";
  const status = await updateUserQuizStatus(answer.userAnswer, user);
  let SendEmails = "";
  // send to raters email with this answerId
  if (status === "finished") {
    if (answer.raters.length !== 0) {
      SendEmails = await SendEmailsToRaters(answer, user.name);
    }
    answer.isUserAnserCompleted = 1;
    await answer.save();
    // can i update answer here and save again ??
    message = "تم انهاء الاختبار بنجاح وتم ارسال رساله الي المقيمين لتقييمك";
  } else {
    message = "تم تسجيل الاجابات الحاليه ,لا تنسي تكمله الاختبار";
  }
  //-------------------B4 end-------------------//

  //send response
  return res
    .status(200)
    .json({ status: "success", message, SendEmails: SendEmails });
});
//--------------------------------------------------------------------------------------//
//first second ?  ?  ?  ?
exports.getUserAnswers = asyncHandler(async (req, res) => {
  try {
    const { userId, status } = req.params; // Assuming userId is passed as a parameter
    const user = await User.findById(userId); // Retrieve the user

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    // Find the user's answers and populate the associated questions
    const userAnswers = await Answer.find({ userId })
      .populate("userAnswer.questionId")
      .exec();
    //check if user took the exam
    if (!userAnswers[status]) {
      return res
        .status(400)
        .json({ status: `faild`, msg: `انت لم تأخذ هذا الأختبار` });
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
      const answerText = userAnswer.answerText;

      // Create an object for the current question
      if (!response[question._id]) {
        response[question._id] = {
          question: questionText,
          userAnswer: userAnswerValue,
          answerText,
          raters: [],
        };
      }
    });

    // Loop through the raters' answers for the current question
    userAnswers[status].raters.forEach((rater) => {
      const raterEmail = rater.email;
      const raterName = rater.name;

      rater.answers.forEach((raterAnswer) => {
        const questionId = raterAnswer.questionId.toString();

        // Check if the question ID exists in response
        if (response[questionId]) {
          const raterAnswerValue = raterAnswer.answer;
          const raterAnswerText = raterAnswer.answerText;

          // Add the rater's answer to the current question's object
          response[questionId].raters.push({
            email: raterEmail,
            name: raterName,
            answer: raterAnswerValue,
            raterAnswerText,
          });
        }
        // response2.push(response[questionId]);
      });
    });
    response2.push(...Object.values(response));
    response2.firstAnsRaters = userAnswers[status].raters;

    // Return the formatted response
    res
      .status(200)
      .json({ ratersNumber: userAnswers[status].raters.length, response2 });
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
});
//--------------------------------------------------------------------------------------------------------------//
exports.getUserAnswersReportTotal = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //check if user took the two exam
    if (!user.retakeQuizAt && user.quizStatus !== "finished") {
      return res
        .status(404)
        .json({ message: "عليك ب اكمال الاختبارين لتحصل علي التقرير الشامل" });
    }

    // Find all keys
    const keys = await Key.find({ _id: { $in: user.allowed_keys } });
    if (!keys) {
      return res.status(404).json({ message: "keys not found" });
    }

    // Initialize an array to store the results for all keys and questions
    const results = [];
    // Iterate over each key
    for (const key of keys) {
      let firstAnsRaters = 0;
      let secondAnsRaters = 0;
      // Find all questions for the current key
      const questions = await Questions.find({ section: key._id });
      if (!questions) {
        continue;
      }
      // Find the user's answers for the current key
      const userAnswers = await Answer.find({
        userId: userId,
        "userAnswer.questionId": { $in: questions.map((q) => q._id) },
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

      //------------------------------------------------------------------------------

      if (userAnswers[0].raters) {
        userAnswers[0].raters.forEach((rater) => {
          rater.answers.forEach((ans) => {
            const questionId = ans.questionId.toString();
            if (!averageRaterAnswers[questionId]) {
              // Ensure initialization
              averageRaterAnswers[questionId] = { before: 0, after: 0 };
            }
            averageRaterAnswers[questionId].before += ans.answer;
          });
        });

        // Only proceed with this block if the first set of answers has raters
        firstAnsRaters = userAnswers[0].raters.filter(
          (rater) => rater.answers.length !== 0
        );

        questions.forEach((question) => {
          const questionId = question._id.toString();
          if (firstAnsRaters.length) {
            // Avoid division by zero
            averageRaterAnswers[questionId].before /= firstAnsRaters.length;
          }
        });
      }

      //--------------------------------------------------------------------------------
      // Repeat the process for the second set of rater answers, if available
      if (userAnswers[1].raters) {
        userAnswers[1].raters.forEach((rater) => {
          rater.answers.forEach((ans) => {
            const questionId = ans.questionId.toString();
            averageRaterAnswers[questionId].after += ans.answer;
          });
        });

        secondAnsRaters = userAnswers[1].raters.filter(
          (rater) => rater.answers.length !== 0
        );

        questions.forEach((question) => {
          averageRaterAnswers[question._id].after /=
            secondAnsRaters.length || 1; // Avoid division by zero
        });
      }
      //--------------------------------------------------------------------------------

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
            raters: Number(averageRaterAnswers[questionId].before.toFixed(2)), //will be 0 if no rater answered
          },
          after: {
            user: userAnswerAfter ? userAnswerAfter.answer : null,
            raters: Number(averageRaterAnswers[questionId].after.toFixed(2)), //will be 0 if no rater answered
          },
          avg: {
            user: Number(userDiff.toFixed(2)),
            raters: Number(ratersDiff.toFixed(2)),
          },
        };
      });

      // Calculate the total differences for user and raters across all questions
      const totalDifference = keyResult.reduce(
        (total, question) => {
          if (question.avg.user !== null) {
            total.user += Number(question.avg.user);
          }
          if (question.avg.raters !== null) {
            total.raters += Number(question.avg.raters);
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
        ratersBefore: firstAnsRaters.length,
        ratersAfter: secondAnsRaters.length,
        desc: key.desc ? key.desc : null,
        questions: keyResult,
        graph: graph,
        totalDifference: totalDifference,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error: ", error.message);

    return res.status(400).json({
      status: "failed",
      msg: error.message,
      msg2: "User should take the quiz twice, and all raters should submit their answers in both times",
    });
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
  // C1 that's mean this is the first time he take quiz
  // C2  that's mean this is the second time he take quiz
  if (
    userAnswers.length === 0 ||
    (user.retakeQuizAt && userAnswers.length === 1)
  ) {
    return [];
  }

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
const SendEmailsToRaters = async (answer, senderName) => {
  const url = `${process.env.RATERS_URL}`;
  for (const rater of answer.raters) {
    const raterEmail = rater.email;

    try {
      console.log("Sending email to: ", raterEmail);
      let emailMessage = `بسم الله الرحمن الرحيم

      عزيزي/عزيزتي ${rater.name} 
      
      السلام عليكم ورحمة الله وبركاته..
      وأسعد الله أوقاتكم بكل خير..
      
      يتقدم إليكم ${senderName}، بوافر الشكر والتقدير على تقييمه على مقياس "نعم أستطيع"، والذي سيكون له أثره البالغ في تطويره.
       
      نأمل منكم الاستجابة للدعوة والمشاركة في تقييمه، وذلك من خلال الرابط التالي:
      ${url}
      واستخدام الرمز التالي عند تسجيل إجابتك:
      ${answer._id}

      شكراً لكم...
      مجموعة بناء
      فريق برنامج نعم أستطيع`;

      await sendEmail({
        to: raterEmail,
        subject: `دعوة لتقييم ${senderName}`,
        text: emailMessage,
      });

      rater.gotEmailAt = Date.now(); // Update gotEmailAt
      await rater.save(); // Save the updated rater
    } catch (err) {
      console.error("Error: " + err.message);
      return `${err.message}`;
      // return new ApiError("There is a problem with sending Email", 500);
    }
  }

  return true;
};
//--------------------------------------------------------------------------------------------------------------//
//test it
exports.SendEmailToRater = async (req, res) => {
  const { raterEmail, userId, docId } = req.body;
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return res
      .status(400)
      .json({ status: "faild", msg: "هذا الطالب غير موجود" });
  }

  const url = `${process.env.RATERS_URL}`;

  try {
    let emailMessage = "";

    emailMessage = ` مرحبًا ${raterEmail} 
           \n صديقك ${user.email} قام بدعوتك
           \n لتقييمه في اختبار سريع
           \n إليك الرابط : ${url}
           \n استخدم هذا الرمز عند تسجيل إجابتك :
            ${docId}`;

    await sendEmail({
      to: raterEmail,
      subject: `rate your frined`,
      text: emailMessage,
    });

    //update gotEmailAt
    await Answer.findOneAndUpdate(
      { _id: docId, "raters.email": raterEmail },
      { $set: { "raters.$.gotEmailAt": Date.now() } }
    );

    return res.status(200).json({
      status: "success",
      msg: "تم ارسال الايميل بنجاح",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", msg: err.message || "Internal server error" });
  }
};
//--------------------------------------------------------------------------------------------------------------//
exports.SendReportDocToUser = async (req, res) => {
  // const { userId } = req.body;
  // const user = await User.findById(userId);

  try {
    let emailMessage = "";

    emailMessage = `مرحبًا 
             \n التقرير النهائي الخاص بك جاهز
             \n يمكنك مشاهدته الآن`;

    await sendEmail({
      to: "abdogomaa4600@gmail.com",
      subject: `finnal report`,
      text: emailMessage,
      attachments: [
        {
          filename: "finnalReportDoc.pdf", // Adjust the filename as needed
          content: req.file.buffer, // Assuming 'buffer' contains the file content
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      msg: "reportDoc sent successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", msg: err.message || "Internal server error" });
  }
};
//--------------------------------------------------------------------------------------------------------------//
// Use multer or another middleware to handle file uploads
exports.upload = multer({
  storage: multer.memoryStorage(),
}).single("reportDoc"); // Assuming 'answerDoc' is the field name in the form

//--------------------------------------------------------------------------------------------------------------//
//@desc update user quiz status
//@use  in answerService , to update user quiz status
//params answeredQuestions:number     user:object
const updateUserQuizStatus = async (answeredQuestions, user) => {
  //check the desired question = the answered question
  console.log(user);
  const questions = await Questions.find({
    section: { $in: user.allowed_keys },
  });
  console.log(questions.length + " :: " + answeredQuestions.length);
  if (questions.length == answeredQuestions.length) {
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
//--------------------------------------------------------------------------------------------------------------//
// function to update and check if anser isCompleted
exports.updateIsRaterAnsersCompleted = async (answerDoc) => {
  let flag = true;
  answerDoc.raters.forEach((rater) => {
    if (!rater.answers || rater.answers.length === 0) {
      flag = false;
    }
  });

  if (flag) {
    answerDoc.isRatersAnserCompleted = 1;
    await answerDoc.save();
    return true;
  } else {
    return false;
  }
};
//--------------------------------------------------------------------------------------------------------------//
// function to update and check if anser isCompleted
exports.checkUserReport = async (userId) => {
  const userAnswers = await Answer.find({ userId });
  if (userAnswers.length === 2) {
    if (
      userAnswers[0].isUserAnserCompleted === true &&
      userAnswers[0].isRatersAnserCompleted === true &&
      userAnswers[1].isUserAnserCompleted === true &&
      userAnswers[1].isRatersAnserCompleted === true
    ) {
      return true;
    }
  } else {
    return false;
  }
};
//--------------------------------------------------------------------------------------------------------------//
exports.getAnswerEmails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const answers = await Answer.find({ userId });

  if (!answers) {
    return res
      .status(400)
      .json({ status: "faild", msg: "الطالب لم يأخذ الأختبار" });
  }

  const data1 = [];
  const data2 = [];
  let docId1 = null;
  let docId2 = null;

  if (answers[0]) {
    answers[0].raters.forEach((rater) => {
      data1.push({
        raterId: rater._id,
        email: rater.email,
        name: rater.name,
        gotEmailAt: rater.gotEmailAt,
      });
    });
    docId1 = answers[0]._id;
  }

  if (answers[1]) {
    answers[1].raters.forEach((rater) => {
      data2.push({
        raterId: rater._id,
        email: rater.email,
        name: rater.name,
        gotEmailAt: rater.gotEmailAt,
      });
    });
    docId2 = answers[1]._id;
  }

  return res.status(200).json({ userId, docId1, data1, docId2, data2 });
});
//--------------------------------------------------------------------------------------------------------------//
exports.updateRaterEmail = asyncHandler(async (req, res) => {
  const { raterId, newEmail, newName } = req.body;

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
    if (newName) {
      rater.name = newName;
    }
    rater.answers = []; // Reset answers
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
