// Validation utilities
export const validators = {
  validateInput: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(value)) {
      return true;
    } else {
      return false;
    }
  },

  validatePassword: (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

    if (passwordRegex.test(password)) {
      return true;
    } else {
      return false;
    }
  },

  validateFile: (file: File) => {
    const validFileTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validFileTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a PDF, DOCX, or TXT file.',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds the limit of 50MB.',
      };
    }

    return {
      isValid: true,
    };
  },
};
