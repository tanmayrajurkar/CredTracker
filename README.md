# CredTracker


This is a modern, interactive web application designed to help users efficiently track their academic credits, categorize them, and monitor their progress towards program completion. Built with a focus on user experience and data persistence, this tool provides a clear overview of earned and remaining credits, ensuring users stay on track with their academic goals.

### Key Features:

*   **Interactive Credit Distribution Table**: A dynamic and editable table that displays credit categories (e.g., University Core, Program Elective, University Elective) and their corresponding credit values.
*   **Expandable Detailed Views**: Each main credit category can be expanded to reveal a detailed sub-table, allowing users to input and manage individual credit baskets within that category.
*   **Real-time Calculations**: Automatically calculates and displays the total credits, with visual feedback if the total does not match the user's target credits to complete.
*   **User Authentication**: Secure login, signup, and password reset functionalities powered by Supabase, ensuring individual user data privacy.
*   **Personalized Data Management**: Credit baskets are user-specific, allowing each user to manage their unique credit data, while main credit categories can be shared globally.
*   **Onboarding Flow**: A guided initial setup for new users to enter their name and total credits to complete, personalizing their tracking experience.
*   **Profile Management**: Users can view and edit their profile details, including their name and total credits goal, and change their password.
*   **Responsive Design**: The user interface is optimized for various screen sizes, providing a seamless experience on desktops, tablets, and mobile devices.
*   **Secure Environment Variable Handling**: Supabase API keys are securely managed using environment variables, preventing sensitive data from being hardcoded or committed to version control.

### Technologies Used:

*   **Frontend**: HTML5, CSS3, JavaScript
*   **Backend as a Service (BaaS)**: Supabase (for database, authentication, and real-time capabilities)
*   **Local Development Server**: Node.js with Express and Dotenv (for serving static files and environment variables)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Deployment to Netlify

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Log in to Netlify and click "New site from Git"

3. Choose your repository and configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `public`

4. Add the following environment variables in Netlify's site settings:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase project API key

5. Deploy!

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase project API key

## Project Structure

- `public/`: Contains all static files for production
- `index.html`: Main HTML file
- `styles.css`: Main stylesheet
- `style.js`: Main JavaScript file
- `config.js`: Configuration file for environment variables


### Setup and Running the Project:

1.  **Clone the Repository**:
    ```bash
    git clone [YOUR_REPOSITORY_URL]
    cd [YOUR_PROJECT_DIRECTORY]
    ```
2.  **Environment Variables**:
    Create a `.env` file in the root of your project and add your Supabase credentials:
    ```
    SUPABASE_URL=YOUR_SUPABASE_URL
    SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    (Remember to add `.env` to your `.gitignore` file to prevent it from being committed.)
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Start the Development Server**:
    ```bash
    npm start
    ```
5.  **Access the Application**:
    Open your web browser and navigate to `http://localhost:3000`. 