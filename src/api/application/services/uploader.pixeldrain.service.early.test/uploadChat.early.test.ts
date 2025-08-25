// Unit tests for: uploadChat

import { spawn } from "child_process";
import * as fs from "node:fs";
import { LiveService } from "../../services/lives.service.js";
import { StreamersService } from "../../services/streamers.service.js";
import { UploadPixeldrainService } from "../uploader.pixeldrain.service";

jest.mock("node:fs");
jest.mock("child_process");
jest.mock("../../services/lives.service.js");
jest.mock("../../services/streamers.service.js");

describe("UploadPixeldrainService.uploadChat() uploadChat method", () => {
  let uploadService: UploadPixeldrainService;
  let mockSpawn: jest.Mock;
  let mockFsCreateWriteStream: jest.Mock;

  beforeEach(() => {
    uploadService = new UploadPixeldrainService();
    mockSpawn = spawn as jest.Mock;
    mockFsCreateWriteStream = fs.createWriteStream as jest.Mock;
  });

  describe("Happy Path", () => {
    it("should successfully upload chat and process response", async () => {
      // Arrange
      const fileName = "testFile";
      const live_id = "live123";
      const streamer = "testStreamer";
      const platform = "twitch";
      const mockProcess = {
        stdout: { pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === "close") {
            callback(0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);
      mockFsCreateWriteStream.mockReturnValue({});

      const mockReadFile = jest
        .spyOn(fs, "readFile")
        .mockImplementation((path, encoding, callback) => {
          callback(null, JSON.stringify({ id: "chat123" }));
        });

      const mockAddAlbumID = jest
        .spyOn(StreamersService.prototype, "addAlbumID")
        .mockResolvedValue(undefined);
      const mockUpdateChat = jest
        .spyOn(LiveService.prototype, "updateChat")
        .mockResolvedValue(undefined);

      // Act
      await uploadService.uploadChat(fileName, live_id, streamer, platform);

      // Assert
      expect(mockSpawn).toHaveBeenCalledWith(
        "curl",
        expect.any(Array),
        expect.any(Object),
      );
      expect(mockFsCreateWriteStream).toHaveBeenCalledWith(
        expect.stringContaining(fileName + "chat.json"),
      );
      expect(mockReadFile).toHaveBeenCalled();
      expect(mockAddAlbumID).toHaveBeenCalledWith(
        streamer,
        "chat123",
        platform,
      );
      expect(mockUpdateChat).toHaveBeenCalledWith(live_id, "chat123");
    });
  });

  describe("Edge Cases", () => {
    it("should handle file read error gracefully", async () => {
      // Arrange
      const fileName = "testFile";
      const live_id = "live123";
      const streamer = "testStreamer";
      const platform = "twitch";
      const mockProcess = {
        stdout: { pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === "close") {
            callback(0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);
      mockFsCreateWriteStream.mockReturnValue({});

      const mockReadFile = jest
        .spyOn(fs, "readFile")
        .mockImplementation((path, encoding, callback) => {
          callback(new Error("File read error"), null);
        });

      // Act
      await uploadService.uploadChat(fileName, live_id, streamer, platform);

      // Assert
      expect(mockSpawn).toHaveBeenCalledWith(
        "curl",
        expect.any(Array),
        expect.any(Object),
      );
      expect(mockFsCreateWriteStream).toHaveBeenCalledWith(
        expect.stringContaining(fileName + "chat.json"),
      );
      expect(mockReadFile).toHaveBeenCalled();
    });

    it("should handle JSON parse error gracefully", async () => {
      // Arrange
      const fileName = "testFile";
      const live_id = "live123";
      const streamer = "testStreamer";
      const platform = "twitch";
      const mockProcess = {
        stdout: { pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === "close") {
            callback(0);
          }
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);
      mockFsCreateWriteStream.mockReturnValue({});

      const mockReadFile = jest
        .spyOn(fs, "readFile")
        .mockImplementation((path, encoding, callback) => {
          callback(null, "Invalid JSON");
        });

      // Act
      await uploadService.uploadChat(fileName, live_id, streamer, platform);

      // Assert
      expect(mockSpawn).toHaveBeenCalledWith(
        "curl",
        expect.any(Array),
        expect.any(Object),
      );
      expect(mockFsCreateWriteStream).toHaveBeenCalledWith(
        expect.stringContaining(fileName + "chat.json"),
      );
      expect(mockReadFile).toHaveBeenCalled();
    });
  });
});

// End of unit tests for: uploadChat
