const asyncHandler = require("express-async-handler");
const Key = require("../models/keyModel");
const User= require("../models/userModel");
const Questions = require("../models/questionModel");
const Answer = require("../models/answerModel");
const fs=require('fs');
const PDF = require('pdfkit');




async function checkIfUserHasThreeRaters(userId) {
  // Get the user document from the database
  const answer = await Answer.findOne({ userId: userId });

  // Check if the user document exists
  if (answer) {
    // Check if the user has already been rated by the rater
    if (answer.raters.length == 3) {
      // The user has already been rated by the rater
      return true;
    } else {
      // The user has not yet been rated by the rater
      return false;
    }
  } else {
    return false;
  }
}


async function checkIfUserHasAnswerBefore(userId) {
  // Get the user document from the database
  const answer = await Answer.findOne({ userId: userId });

  // Check if the user document exists
  if (answer) {
    // Check if the user has an answer already
    if (answer.userAnswer.length>=1) {
      return true;
    } else {
      
      return false;
    }
  } else {
    return false;
  }
}
//@desc Save answers to user
//@route POST /api/v1/answer/saveanswers
//@access private
exports.saveAnswers = asyncHandler(async (req, res) => {
  const { answers,isRater, raterEmail} = req.body;
  const userId = req.user._id;
  //validation on raters' emails
  if (isRater) {
    const hasThreeRaters = await checkIfUserHasThreeRaters(userId);
    if(hasThreeRaters){
      const secondAnswerDocument = await Answer.findOne({ userId: userId }, { sort: { createdAt: 1 } }).skip(1);
      await secondAnswerDocument.updateOne({ $push: { raters: { email: raterEmail, answers: answers } } });
      return res.status(200).json({status:"Added a rater to the second answer successfully"});
    }
    else{
        await Answer.updateOne({ userId: userId }, {
          $push: {
            raters: { email: raterEmail,answers:answers }
          }
        });
      return res.status(200).json({status:"Added a rater successfully"});
    }
    // The user is a rater
    
  } else {
    const user = await User.findOne({_id:userId});
    if(user.quizTaken){
      return res.status(200).json({ status: "you cannot take test again" });
    }
    user.quizTaken=1;
    user.save();
    const hasAnswer= await checkIfUserHasAnswerBefore(userId);
    if (hasAnswer) {
      const answer = new Answer({
        userId,
        userAnswer: answers,
      });
      await answer.save();
      return res.status(200).json({ status: "This user had answers before. Adding new answers to the array" });
    }
    

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











// exports.countAnswersAverage = asyncHandler(async (req, res) => {
//   const result = [];

//   const userId = req.user._id;
//   // Get all sections
//   const sections = await Key.find();
//   // Loop on each section
//   // eslint-disable-next-line no-restricted-syntax
//   for (const section of sections) {
//     // Find all answers for the user in the section
//     // eslint-disable-next-line no-await-in-loop
//     const answers = await Answer.findOne(
//       {
//         userId,
//         questionId: {
//           section: section.id,
//         },
//       }
//     );
//     // Check if there are answers
//     if(!answers){
//       return res.status(404).json({status:`user didn't take the quiz`})
//     }
//     // Calculate the total answerEvaluation
//     const answersArray = Array.from(answers);
//       const totalAnswerevaluation = answersArray.reduce((acc, answer) => {
//         acc += answer.userAnswer.reduce(
//           // eslint-disable-next-line no-shadow
//           (acc, answer) => {acc + answer.answer
//           return acc;
//           },0
//         );
//         return acc;
//       }, 0);

//       // Calculate the average answerevaluation
//       const averageAnswerevaluation =
//         totalAnswerevaluation / answers.userAnswer.length;

//       // Add the average answerevaluation to the result
//       result.push({
//         sectionId: section.id,
//         averageAnswerevaluation,
//       });
   
//   }

//   // Return the result
//   res.json(result);
// });








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
      sectionname:section.name,
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
            sectionname:section.name,
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
  const answers = await Answer
  .find({ userId: userId })
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
    const specificQuestion = questions.find((question) => question._id.equals(questionAnswer.questionId));
    pdfdocument.text(`Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`);
    
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
        const specificQuestion = questions.find((question) => question._id.equals(questionAnswer.questionId));
        pdfdocument.text(`Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`);
      }
      pdfdocument.text(`-----------------`);
    }
    pdfdocument.addPage();
    //Iterate on the second user answers
    pdfdocument.text("Second User Answers");
    for (const questionAnswer of secondAnswers.userAnswer) {
      const specificQuestion = questions.find((question) => question._id.equals(questionAnswer.questionId));
      pdfdocument.text(`Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`);
      
    }
    pdfdocument.text(`-----------------`);
    pdfdocument.text("Second Rater Answers");
    for (const rater of secondAnswers.raters) {
      for (const questionAnswer of rater.answers) {
        const specificQuestion = questions.find((question) => question._id.equals(questionAnswer.questionId));
        pdfdocument.text(`Question: ${specificQuestion.text} Answer: ${questionAnswer.answer}`);
        
      }
      pdfdocument.text(`-----------------`);
    }
    


    pdfdocument.end();
    setTimeout(() => {
      res.download(resultsFilename);
    }, 100); 
  


  
  

});