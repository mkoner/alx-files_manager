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
    console.log(user);
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
    console.log(file);

    return response.status(201).send({
      id: file.ops[0]._id,
      userId: file.ops[0].userId,
      name: file.ops[0].name,
      type: file.ops[0].type,
      isPublic: file.ops[0].isPublic,
      parentId: file.ops[0].parentId,
    });
  }
}

export default FilesController;
