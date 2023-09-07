import { ObjectId } from 'mongodb';
import { mkdir, writeFile, readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

import userUtils from '../utils/userUtils';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(request, response) {
    const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
    const { userId } = await userUtils.getUserIdAndKey(request);
    if (!userId) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = request.body;
    const acceptedTypes = ['folder', 'file', 'image'];
    if (!name) return response.status(400).send({ error: 'Missing name' });
    if (!type && !acceptedTypes.includes(type)) return response.status(400).send({ error: 'Missing type' });
    if (type !== 'folder' && !data) return response.status(400).send({ error: 'Missing data' });
    if (parentId !== 0) {
      const parentFile = await dbClient.filesCollection.findOne({ _id: ObjectId(parentId) });
      if (!parentFile) return response.status(400).send({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return response.status(400).send({ error: 'Parent is not a folder' });
    }
    const fileToUpload = {
      name,
      type,
      parentId,
      isPublic,
      userId: user._id,
    };
    if (type === 'folder') {
      const folder = await dbClient.filesCollection.insertOne(fileToUpload);
      return response.status(201).send({
        id: folder.ops[0]._id,
        userId: folder.ops[0].userId,
        name: folder.ops.name,
        type: folder.ops[0].type,
        isPublic: folder.ops[0].isPublic,
        parentId: folder.ops[0].parentId,
      });
    }

    const fileUid = uuidv4();

    const decData = Buffer.from(data, 'base64');
    const filePath = `${dir}/${fileUid}`;

    mkdir(dir, { recursive: true }, (error) => {
      if (error) return response.status(400).send({ error: error.message });
      return true;
    });

    writeFile(filePath, decData, (error) => {
      if (error) return response.status(400).send({ error: error.message });
      return true;
    });

    fileToUpload.localPath = filePath;
    const file = await dbClient.filesCollection.insertOne(fileToUpload);

    return response.status(201).send({
      id: file.ops[0]._id,
      userId: file.ops[0].userId,
      name: file.ops[0].name,
      type: file.ops[0].type,
      isPublic: file.ops[0].isPublic,
      parentId: file.ops[0].parentId,
    });
  }

  static async getShow(request, response) {
    const fileId = request.params.id;
    const { userId } = await userUtils.getUserIdAndKey(request);
    if (!userId) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
    const file = await dbClient.filesCollection.findOne({
      _id: ObjectId(fileId),
      userId: user._id,
    });
    if (!file) return response.status(404).send({ error: 'Not found' });
    return response.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(request, response) {
    const parentId = request.query.parentId || 0;
    const page = request.query.page || 0;
    const { userId } = await userUtils.getUserIdAndKey(request);
    const user = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const pipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      {
        $limit: 20,
      },
    ];
    const files = await dbClient.filesCollection.aggregate(pipeline).toArray();
    const filesToReturn = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));
    return response.status(200).send(filesToReturn);
  }

  static async putPublish(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);
    const user = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
    const { id } = request.params;
    const file = await dbClient.filesCollection.findOne({ _id: ObjectId(id), userId: user._id });
    if (!file) return response.status(404).send({ error: 'Not found' });
    await dbClient.filesCollection.updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });
    const UpdatedFile = await dbClient.files.findOne({ _id: ObjectId(id), userId: user._id });

    return response.status(200).send({
      id: UpdatedFile._id,
      userId: UpdatedFile.userId,
      name: UpdatedFile.name,
      type: UpdatedFile.type,
      isPublic: UpdatedFile.isPublic,
      parentId: UpdatedFile.parentId,
    });
  }

  static async putUnPublish(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);
    const user = await dbClient.usersCollection.findOne({ _id: ObjectId(userId) });
    if (!user) {
      return response.status(401).send({ error: 'Unauthorized' });
    }
  }
}

export default FilesController;
