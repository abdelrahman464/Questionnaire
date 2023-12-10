const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
  },
  coordiantors: [
    {
      name: {
        type: String,
      },
      email: {
        type: String,
      },
      password: {
        type: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const setLogoImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.logo) {
    const logoImageUrl = `${process.env.BASE_URL}/organizations/${doc.logo}`;
    doc.logo = logoImageUrl;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
organizationSchema.post("init", (doc) => {
  setLogoImageURL(doc);
});
// it work with create
organizationSchema.post("save", (doc) => {
  setLogoImageURL(doc);
});

module.exports = mongoose.model("Organization", organizationSchema);
