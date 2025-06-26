import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // Normalize face descriptor to unit vector
  private normalizeDescriptor(descriptor: number[]): number[] {
    const magnitude = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return descriptor; // Avoid division by zero
    return descriptor.map((val) => val / magnitude);
  }

  async register(name: string, faceDescriptor: number[]) {
    if (!name || !faceDescriptor || faceDescriptor.length !== 128) {
      throw new Error('Invalid name or face descriptor');
    }

    // Normalize descriptor before storing
    const normalizedDescriptor = this.normalizeDescriptor(faceDescriptor);

    const user = await this.prisma.user.create({
      data: {
        name,
        faceDescriptor: JSON.stringify(normalizedDescriptor),
      },
    });

    return { message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi", userId: user.id };
  }

  async signin(faceDescriptor: number[]) {
    if (!faceDescriptor || faceDescriptor.length !== 128) {
      throw new Error('Invalid face descriptor');
    }

    const users = await this.prisma.user.findMany();
    let bestMatch: any = null;
    let bestScore = -1;

    // Normalize input descriptor
    const normalizedInput = this.normalizeDescriptor(faceDescriptor);

    for (const user of users) {
      const dbDescriptor = JSON.parse(user.faceDescriptor) as number[];
      if (dbDescriptor.length !== 128) continue; // Skip invalid descriptors

      // Calculate cosine similarity
      const score = this.cosineSimilarity(normalizedInput, dbDescriptor);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = user;
      }
    }

    // Adjusted threshold for better matching
    const THRESHOLD = 0.97;
    if (bestMatch && bestScore > THRESHOLD) {
      return {
        message: 'Kirish muvaffaqiyatli',
        userId: bestMatch.id,
        name: bestMatch.name,
        score: bestScore,
      };
    } else {
      return {
        message: 'Yuz tanilmadi',
        score: bestScore,
      };
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return -1;

    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (normA === 0 || normB === 0) return -1; // Avoid division by zero
    return dot / (normA * normB);
  }
}