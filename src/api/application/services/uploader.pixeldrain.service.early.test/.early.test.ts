// Unit tests for:

import { spawn } from "child_process";
import * as fs from "node:fs";
import {
  INFOuploadService,
  UploadPixeldrainService,
} from "../uploader.pixeldrain.service";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

jest.mock("node:fs", () => ({
  createWriteStream: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock("../../services/pixeldrain.service");
jest.mock("../../services/lives.service");
jest.mock("../../services/streamers.service");

describe("UploadPixeldrainService.()  method", () => {
  let service: UploadPixeldrainService;
  const mockInfo: INFOuploadService = {
    token: "test-token",
    api_url: "http://test-api-url.com",
    absolute_path_streams: "/test/path/streams/",
  };

  beforeEach(() => {
    service = new UploadPixeldrainService(mockInfo);
  });

  describe("uploadStream", () => {
    it("should successfully upload a stream (happy path)", async () => {
      // Arrange
      const fileName = "testFile";
      const streamer = "testStreamer";
      const platform = "testPlatform";
      const live_id = "testLiveId";
      const mockSpawn = spawn as jest.Mock;
      const mockProcess = {
        stdout: { pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === "close") callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      await service.uploadStream(fileName, streamer, platform, live_id);

      // Assert
      expect(mockSpawn).toHaveBeenCalled();
      expect(mockProcess.stdout.pipe).toHaveBeenCalled();
    });

    it("should handle file read error gracefully (edge case)", async () => {
      // Arrange
      const fileName = "testFile";
      const streamer = "testStreamer";
      const platform = "testPlatform";
      const live_id = "testLiveId";
      const mockReadFile = fs.readFile as jest.Mock;
      mockReadFile.mockImplementation((path, encoding, callback) => {
        callback(new Error("File read error"), null);
      });

      // Act & Assert
      await expect(
        service.pixeldrainReadFileResponseUploadStream(
          fileName,
          streamer,
          platform,
          live_id,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("uploadChat", () => {
    it("should successfully upload a chat (happy path)", async () => {
      // Arrange
      const fileName = "testFile";
      const streamer = "testStreamer";
      const platform = "testPlatform";
      const live_id = "testLiveId";
      const mockSpawn = spawn as jest.Mock;
      const mockProcess = {
        stdout: { pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === "close") callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      // Act
      await service.uploadChat(fileName, streamer, platform, live_id);

      // Assert
      expect(mockSpawn).toHaveBeenCalled();
      expect(mockProcess.stdout.pipe).toHaveBeenCalled();
    });

    it("should handle JSON parse error gracefully (edge case)", async () => {
      // Arrange
      const fileName = "testFile";
      const streamer = "testStreamer";
      const platform = "testPlatform";
      const live_id = "testLiveId";
      const mockReadFile = fs.readFile as jest.Mock;
      mockReadFile.mockImplementation((path, encoding, callback) => {
        callback(null, "invalid JSON");
      });

      // Act & Assert
      await expect(
        service.pixeldrainReadFileResponseUploadChat(
          fileName,
          streamer,
          platform,
          live_id,
        ),
      ).resolves.toBeUndefined();
    });
  });
});

// End of unit tests for:
