const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

// createCourse handler function
exports.createCourse = async (req, res) => {
    try{
        // get the data
        const {courseName, courseDescription, whatYouWillLearn, price, tag: _tag, category, status, instructions: _instructions,} = req.body;

        // get thumbnail
        const thumbnail = req.files.thumbnailImage;

        // Convert the tag and instructions from stringified Array to Array
        const tag = JSON.parse(_tag)
        const instructions = JSON.parse(_instructions)

        console.log("tag", tag)
        console.log("instructions", instructions)

        // validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag.length || !thumbnail || !category || !instructions.length) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }
        if (!status || status === undefined) {
          status = "Draft"
        }

        // check for Instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId, {accountType: "Instructor"});
        console.log("InstructorDetails: ", instructorDetails);

        if(!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: 'Instructor Details not found',
            });
        }

        // check given tag is valid or not
        const CategoryDetails = await Category.findById(category);
        if(!CategoryDetails) {
            return res.status(404).json({
                success: false,
                message: 'Tag Details not found',
            });
        }

        // upload Image to Clodinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        // create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag,
            category: CategoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions,
        })

        // add the new course to the user schema of instructor
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new:true},
        )

        // Add the new course to the Categories
        const categoryDetails2 = await Category.findByIdAndUpdate(
          { _id: category },
          {
            $push: {
              courses: newCourse._id,
            },
          },
          { new: true }
        )
        console.log("HEREEEEEEEE", categoryDetails2)

        // return response
        return res.status(200).json({
            success: true,
            message: 'Course Created Successfully',
            data: newCourse,
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create Course',
            error: error.message,
        })
    }
};

// getAllCourses handler function
exports.getAllCourses = async (req, res) => {
    try{
        const allCourses = await Course.find({status: "Published"}, {courseName: true, price: true, thumbnail: true, instructor: true, ratingAndReviews: true, studentEnrolled: true}).populate("instructor").exec();

        return res.status(200).json({
            success: true,
            message: 'Data for all courses fetched successfully',
            data: allCourses,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot Fetch course data',
            error: error.message,
        })
    }
};

// getCourseDetails handler
exports.getCourseDetails = async (req, res) => {
  try {
    // get id
    const {courseId} = req.body;

    // find course details
    const courseDetails = await Course.find({_id: courseId}).populate({path: "instructor", populate: {path: "additionalDetials"}}).populate("category").populate("ratingAndreviews").populate({path: "courseContent", populate:{path: "subSection"}}).exec();

    // validation
    if(!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with ${courseId}`,
      });
    }

    // return response
    return res.status(200).json({
      success: true,
      message: 'Course Detail fetched successfuly',
      data: courseDetails,
    });
  } 
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};