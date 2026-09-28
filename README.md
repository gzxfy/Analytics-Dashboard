# Analytics-Dashboard
A system that fetches mock or live data stream data (like trending topics or stock tickers), processes it via Python, and pushes updates to a React frontend instantly without the user refreshing.


TO RUN

backend: 
install all of requirements.txt
run: python -m uvicorn backend.app.main:app --reload  

FrontEnd:
cd FrontEnd
npm run dev

another terminal
run: python generator/generator.py          

Will update this readme. Just a mini one for right now