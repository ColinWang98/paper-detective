/**
 * PDFError - PDF处理错误
 *
 * 用于PDF解析、文本提取等操作失败时
 * HTTP Status: 400 Bad Request / 415 Unsupported Media Type
 */

import { AppError, ErrorCodes, type ErrorContext } from './AppError';

export interface PDFErrorContext extends ErrorContext {
  fileName?: string;
  fileSize?: number;
  pageNumber?: number;
  totalPages?: number;
}

export class PDFError extends AppError {
  public readonly fileName?: string;

  constructor(
    message: string,
    code: string = ErrorCodes.PDF_ERROR,
    statusCode: number = 400,
    context?: PDFErrorContext,
    originalError?: Error
  ) {
    super(
      message,
      code,
      statusCode,
      true,
      context,
      originalError
    );
    this.fileName = context?.fileName;
  }

  /**
   * 无效PDF
   */
  static invalidPDF(fileName?: string, originalError?: Error): PDFError {
    return new PDFError(
      'The file is not a valid PDF document',
      ErrorCodes.INVALID_PDF,
      400,
      { fileName },
      originalError
    );
  }

  /**
   * PDF损坏
   */
  static corruptedPDF(fileName?: string, originalError?: Error): PDFError {
    return new PDFError(
      'The PDF file is corrupted or damaged',
      ErrorCodes.CORRUPTED_PDF,
      400,
      { fileName },
      originalError
    );
  }

  /**
   * 密码保护
   */
  static passwordProtected(fileName?: string): PDFError {
    return new PDFError(
      'The PDF file is password protected',
      ErrorCodes.PASSWORD_PROTECTED_PDF,
      400,
      { fileName }
    );
  }

  /**
   * 解析错误
   */
  static parseError(
    pageNumber?: number,
    originalError?: Error
  ): PDFError {
    return new PDFError(
      pageNumber
        ? `Failed to parse page ${pageNumber}`
        : 'Failed to parse PDF',
      ErrorCodes.PDF_PARSE_ERROR,
      400,
      { pageNumber },
      originalError
    );
  }

  /**
   * 无效文件类型
   */
  static invalidFileType(expectedType: string): PDFError {
    return new PDFError(
      `Invalid file type: expected ${expectedType}`,
      ErrorCodes.INVALID_FORMAT,
      415
    );
  }

  /**
   * 文件过大
   */
  static fileTooLarge(maxSize: number, actualSize: number): PDFError {
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return new PDFError(
      `File too large: ${formatSize(actualSize)} (max: ${formatSize(maxSize)})`,
      ErrorCodes.VALIDATION_ERROR,
      413,
      { fileSize: actualSize }
    );
  }
}
