const Answer = require("../models/answerModel");

exports.checkRaterAuth = async (req, res, next) => {
  const { raterEmail, docId } = req.body;

  // Check if raterEmail and docId exist
  if (!raterEmail || !docId) {
    return res.status(400).json({ error: "Missing raterEmail or docId" });
  }
  const answer = await Answer.findOne(
    {
      _id: docId,
      "raters.email": raterEmail,
    },
    {
      raters: {
        $elemMatch: { email: raterEmail },
      },
    }
  );
  if (!answer) {
    return res.status(400).json({ error: "الايميل خاطئ او الكود" });
  }
  // Check if rater.answers array is empty
  const rater = answer.raters[0];

  if (rater.answers.length !== 0) {
    return res
      .status(400)
      .json({ status: "faild", msg: "غير مسموح لك بتسجيل اجابات مرتين" });
  }
  // Call next() to proceed to the next middleware or route handler
  next();
};
