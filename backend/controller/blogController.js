const Joi = require("joi");
const fs = require("fs");
const Blog = require("../modals/blog");
const { BACKEND_SERVER_PATH } = require("../config/index");
const BlogDTO = require("../dto/blog");
const mongooseIdPattern = /^[0-9a-fA-F]{24}$/;
const blogController = {
  async create(req, res, next) {
    // 1 validate req body
    // 2 handle photo storage, naming
    // 3 add to db
    // 4 return response

    // client side -> base64 encoded string -> decodee -> store ->  save photo's path nin db
    const createBlogSchema = Joi.object({
      title: Joi.string().required(),
      author: Joi.string().regex(mongooseIdPattern).required(),
      content: Joi.string().required(),
      photo: Joi.string().required(),
    });

    const { error } = createBlogSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { title, author, content, photo } = req.body;

    // read as buffer
    const buffer = Buffer.from(
      photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
      "base64"
    );
    const imagePath = `${Date.now()}-${author}.png`;
    try {
      fs.writeFileSync(`storage/${imagePath}`, buffer);
    } catch (e) {
      return next(e);
    }
    let newBlog;
    // debugger;
    try {
      newBlog = new Blog({
        title,
        author,
        content,
        photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`,
      });
      await newBlog.save();
    } catch (e) {
      return next(e);
    }
    const blogDto = new BlogDTO(newBlog);
    res.status(201).json({ blog: blogDto });
  },
  async getAll(req, res, next) {
    try {
      const blogs = await Blog.find({});
      const blogsDto = [];
      for (let i = 0; i < blogs.length; i++) {
        const dto = new BlogDTO(blogs[i]);
        blogsDto.push(dto);
      }
      return res.status(200).json({ blogs: blogsDto });
    } catch (error) {
      return next(error);
    }
  },
  async getById(req, res, next) {},
  async update(req, res, next) {},
  async delete(req, res, next) {},
};
module.exports = blogController;
