# ALTCHA Forms

ALTCHA Forms is a robust, secure platform designed for businesses requiring compliance with data privacy regulations. It facilitates seamless and secure data collection through various forms, ensuring compliance with regulations such as GDPR and HIPAA.

For more information, visit [altcha.org/forms](https://altcha.org/forms).

## Table of Contents

1. [Project Status](#project-status)
2. [Project Goals](#project-goals)
3. [Target Audience](#target-audience)
4. [Use Cases](#use-cases)
5. [Features](#features)
6. [About Encryption](#about-encryption)
7. [About eSignatures](#about-esignatures)
8. [Getting Started](#getting-started)
9. [Self-Hosting](#self-hosting)
   - [Prerequisites](#prerequisites)
   - [Docker Compose](#docker-compose)
   - [Database Migration](#database-migration)
   - [Application Access](#application-access)
   - [Environment Variables](#environment-variables)
10. [Roadmap](#roadmap)
11. [Contributing](#contributing)
12. [License](#license)
13. [Commercial License](#commercial-license)

## Project Status

This project is currently in Public Beta.

## Project Goals

ALTCHA aims to provide a community-driven, open-source solution for modern, privacy-friendly data collection and security. ALTCHA Forms is designed to:

- Offer secure and compliant software for data collection.
- Include advanced features like end-to-end encryption and EU/eIDAS compliant digital signatures.
- Enhance the overall user experience by integrating modern, seamless security and advanced spam protection measures.

## Target Audience

### Large Enterprises

ALTCHA Forms is ideal for enterprises needing advanced security and regulatory compliance. Its open-source, self-hosted nature ensures full data control.

### Medium and Small Businesses

Regardless of size, ALTCHA Forms helps businesses comply with data privacy regulations, making operations safer and more efficient.

### Non-profits

The open-source model suits non-profit organizations and NGOs, offering robust data collection without financial strain.

### Individuals

Even personal websites must comply with data privacy regulations. ALTCHA Forms simplifies compliance for individuals.

## Use Cases

ALTCHA Forms includes several building blocks that simplify the creation of custom forms. Some use cases include:

- Contact Forms
- Registration Forms
- Surveys or Feedback Forms
- Purchase Forms
- Customer Support Forms
- HR/Employee-related Forms
- Appointment Booking Forms
- Event Registration Forms
- Contract Signing
- GDPR Request Forms

## Features

- **Passkeys**: Breach-resistant and phishing-resistant authentication.
- **Built-in AntiSpam**: Invisible Captcha and optional ALTCHA Spam Filter API.
- **End-to-End Encryption**: Asymmetric encryption to protect data.
- **Digital Signatures**: eIDAS-compliant signatures, qualified digital certificates, and DigiDoc.
- **Activity Log**: Comprehensive logs for compliance with HIPAA and other regulations.
- **Form Builder**: Visual tool for creating custom forms without coding.
- **Multi-Step Forms**: Enhance user experience with step-by-step forms.
- **File Attachments**: Securely handle file uploads with end-to-end encryption.
- **Export Options**: Export submissions to PDF, CSV, or JSON for analysis and reporting.
- **Developer Friendly**: Hosted forms or custom HTML form integration via API.

## About Encryption

ALTCHA's Encryption Shield is an automatic, user-friendly encryption system built on the asymmetric RSA algorithm. It secures all employee and customer data, including file attachments.

Submitted form data is encrypted on the server, after validation and processing, and stored in the database encrypted, protecting data from potential data breaches. File attachments are encrypted on the user's device, employing true end-to-end encryption. Only authorized devices with a valid encryption key can decrypt and access protected data.

## About eSignatures

ALTCHA Forms includes support for EU/eIDAS-compliant, legally binding, simple and advanced digital signatures. Simple signatures include hand-written signatures and scanned stamps; advanced signatures include qualified digital certificates (using a signed PDF file) and other formats such as DigiDoc which can be uploaded as attachments.

## Getting Started

To get started with ALTCHA Forms, use the hosted SaaS version:

- [eu.altcha.org/app](https://eu.altcha.org/app) (EU)
- [us.altcha.org/app](https://us.altcha.org/app) (USA)

For self-hosting, follow the instructions below.

## Self-Hosting

### Prerequisites

- Postgres 16+
- Redis 7+
- S3-compatible object store (recommended)
- SMTP server for email

### Docker Compose

Use the provided Dockerfile or docker-compose configuration to start Postgres, Redis, and ALTCHA Forms containers:

```sh
docker-compose up
```

### Database Migration

To apply migrations to the database schema, use the following command (requires Node.js):

```sh
export DATABASE_URL=postgres://...

npx drizzle-kit migrate
```

Alternatively, you can manually create the database tables using a Postgres client and the migration files located in the [/drizzle](/drizzle/) folder.

### Application Access

Navigate to `http://localhost:3000/app` and complete the registration to create your account.

### Environment Variables

Configure `DATABASE_URL`, `REDIS_URL`, and `BASE_URL`. See [env.ts](/src/lib/server/env.ts) for all supported variables.

## Roadmap

Some parts of this project are under development. Future enhancements include:

- Search and Analytics: Client-side, end-to-end encrypted search and analysis.
- Bulk Export: Export responses to PDF, CSV, JSON.
- Finalize Identity Management: Anonymized identity linking, search, and management.

## Contributing

Refer to our [Contributing Guide](https://github.com/altcha-org/altcha-forms/blob/main/CONTRIBUTING.md) and adhere to our [Code of Conduct](https://github.com/altcha-org/altcha-forms/blob/main/CODE_OF_CONDUCT.md).

## License

ALTCHA Forms is licensed under the GNU Affero General Public License version 3 (AGPLv3).

ALTCHA Forms - Secure Data Collection Platform

© 2024 Altcha.org, Daniel Regeci

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

## Commercial License

A commercial license is available for businesses requiring different licensing. This license allows software modification without public disclosure of your source code and removal of ALTCHA branding from public-facing forms and pages.

For more information, visit [altcha.org/forms](https://altcha.org/forms#pricing). Support plans are also available.
