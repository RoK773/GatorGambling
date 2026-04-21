# GatorGambling
Repository for the GatorGambling CEN3031 Group Project

## Running locally
Terminal 1: $env:OLLAMA_ORIGINS="*"; $env:OLLAMA_HOST="0.0.0.0:11434"; ollama serve
Terminal 2: ngrok http 11434
Terminal 3: npm run dev

Gator Gambling is a fun gambling website that focuses on the World Cup. First page when users look up the website is a login page for users. Users can create an account and with those logins  they are able to login and gamble. There are multiple pages. 

Users UI:
##PAGES
Your Picks: Is where you collect your wins 
Players: You can bet on players
Teams: You can bet on teams
Games: You can bet on the game 
Bracket: shows which teams are playing against what so you know when the next game is going to be and with who depend on the teams that advance.
Live: Users see the game being simulated and have a live chat they can reply to other users and see the outcome of the game. 

Moderator UI:
##PAGES
Your Picks: We see wins
Players: We can remove best
Teams: We can remove bets
Games: We can remove bets
Bracket: We can select which teams to start the next simulation 
Live: The moderator starts the simulations we can also regulate the chat and ban users being not gamer friendly
