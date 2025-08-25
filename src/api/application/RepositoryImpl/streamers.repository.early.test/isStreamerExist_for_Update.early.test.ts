// Unit tests for: isStreamerExist_for_Update

import { dataSource } from "../../config/datasource.js";
import { StreamersRepository } from "../streamers.repository.js";

jest.mock("../../config/datasource.js");

describe("StreamersRepository.isStreamerExist_for_Update() isStreamerExist_for_Update method", () => {
  let streamersRepository: StreamersRepository;

  beforeEach(() => {
    streamersRepository = new StreamersRepository();
  });

  describe("Happy Path", () => {
    it("should return true if a streamer with the given name and platform exists", async () => {
      // Arrange: Mock the dataSource to return a streamer
      const mockStreamer = { name: "Streamer1", platform: "Twitch" };
      (dataSource.manager.findOne as jest.Mock).mockResolvedValue(mockStreamer);

      // Act: Call the method with existing streamer details
      const result = await streamersRepository.isStreamerExist_for_Update(
        "Streamer1",
        "Twitch",
      );

      // Assert: Expect the result to be true
      expect(result).toBe(true);
    });

    it("should return false if no streamer with the given name and platform exists", async () => {
      // Arrange: Mock the dataSource to return null
      (dataSource.manager.findOne as jest.Mock).mockResolvedValue(null);

      // Act: Call the method with non-existing streamer details
      const result = await streamersRepository.isStreamerExist_for_Update(
        "NonExistentStreamer",
        "YouTube",
      );

      // Assert: Expect the result to be false
      expect(result).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should return false if the name is an empty string", async () => {
      // Arrange: Mock the dataSource to return null
      (dataSource.manager.findOne as jest.Mock).mockResolvedValue(null);

      // Act: Call the method with an empty name
      const result = await streamersRepository.isStreamerExist_for_Update(
        "",
        "Twitch",
      );

      // Assert: Expect the result to be false
      expect(result).toBe(false);
    });

    it("should return false if the platform is an empty string", async () => {
      // Arrange: Mock the dataSource to return null
      (dataSource.manager.findOne as jest.Mock).mockResolvedValue(null);

      // Act: Call the method with an empty platform
      const result = await streamersRepository.isStreamerExist_for_Update(
        "Streamer1",
        "",
      );

      // Assert: Expect the result to be false
      expect(result).toBe(false);
    });

    it("should handle case sensitivity and return false if the case does not match", async () => {
      // Arrange: Mock the dataSource to return null
      (dataSource.manager.findOne as jest.Mock).mockResolvedValue(null);

      // Act: Call the method with different case
      const result = await streamersRepository.isStreamerExist_for_Update(
        "streamer1",
        "twitch",
      );

      // Assert: Expect the result to be false
      expect(result).toBe(false);
    });

    it("should handle special characters in name and platform", async () => {
      // Arrange: Mock the dataSource to return null
      (dataSource.manager.findOne as jest.Mock).mockResolvedValue(null);

      // Act: Call the method with special characters
      const result = await streamersRepository.isStreamerExist_for_Update(
        "Streamer@123",
        "Twitch!",
      );

      // Assert: Expect the result to be false
      expect(result).toBe(false);
    });
  });
});

// End of unit tests for: isStreamerExist_for_Update
