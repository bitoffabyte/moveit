import SessionCard from 'components/SessionCard';

const HomePage  = () => { 
  return (
    <div>
      <SessionCard
      sessionName="Interval Training"
      instructorName="Daniel Truong"  
      starting={true}
    /></div>
  )
}
//sessionName, sessionDuration, instructorName, startDate, startTime, prerecorded, starting, image, color
export default HomePage