import styles from './page.module.css'
import RoomInfo from './RoomInfo';
import Image from 'next/image';

export default function Home() {
  const date = new Date().toDateString();
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <h1 className={styles.navItem}>QuickCall</h1>
        <h1 className={styles.navItem}  >{date}</h1>
      </nav>
      <div className={styles.container}>
        <div>
          <h1 className={styles.headerText}>Connect with friends.<br />
          In an instant! </h1>
          <p className={styles.description}>Connecting for a quick one-on-one is now simpler than ever.<br/>
          Available for everyone!</p>
          <RoomInfo />
        </div>
        <div>
          <Image src="/talk.svg" alt="video call" width={500} height={500} />
          <p>Create a meeting link and share the code to hop on to a quick one-on-one </p>
        </div>
      </div>
    </main>
  )
}
